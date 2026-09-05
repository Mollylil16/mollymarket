import React, { useState, useEffect, useRef } from 'react';
import { Produit, Categorie, Client, ModePaiement, Vente } from '../../types';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCaisseStore } from '../../store/useCaisseStore';
import { formatFCFA } from '../../utils/format';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { enregistrerVenteHorsLigne } from '../../utils/offlineQueue';
import { imprimerTicketThermiqueDOM, imprimerViaWebSerial } from '../../utils/escposPrinter';
import {
  ScanLine,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  Package,
  Wifi,
  WifiOff,
  RefreshCw,
  Layers,
  Zap
} from 'lucide-react';

interface CartItem {
  produit: Produit;
  quantite: number;
}

interface Props {
  onVenteComplete?: () => void;
}

// Fonction audio pour le bip de caisse supermarché
function playScannerBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignorer si les permissions audio sont bloquées par le navigateur
  }
}

export const SupermarchePOSTerminal: React.FC<Props> = ({ onVenteComplete }) => {
  const { user } = useAuth();
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { isVerrouillee } = useCaisseStore();

  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [caisses, setCaisses] = useState<any[]>([]);
  const [selectedCaisseId, setSelectedCaisseId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Hook Offline-First & Synchro Réseau
  const { isOnline, nbEnAttente, isSyncing, lancerSynchro, rafraichirCompteur } = useOnlineStatus((nb) => {
    toastSuccess(`${nb} vente(s) hors-ligne synchronisée(s) avec succès !`, 'Synchronisation Réseau');
    loadCatalog();
    if (onVenteComplete) onVenteComplete();
  });

  // Filtres catalogue POS
  const [selectedCategorieId, setSelectedCategorieId] = useState<number | 'tous'>('tous');
  const [searchQuery, setSearchQuery] = useState('');

  // Saisie / Scanner Code-Barres
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Panier caisse
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');

  // Règlement espèces & Rendu de monnaie
  const [montantRecu, setMontantRecu] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Ticket de caisse modal
  const [derniereVente, setDerniereVente] = useState<Vente | null>(null);
  const [monnaieRendueAffichee, setMonnaieRendueAffichee] = useState<number>(0);
  const [montantVerseAffiche, setMontantVerseAffiche] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, clientsData, caissesData] = await Promise.all([
        apiClient.getVueStock(),
        apiClient.getVueCategories(),
        apiClient.getVueClients(),
        apiClient.getCaisses().catch(() => [])
      ]);
      setProduits(prodsData);
      setCategories(catsData);
      setClients(clientsData);
      if (caissesData && caissesData.length > 0) {
        setCaisses(caissesData);
      }
    } catch (err: any) {
      toastError('Erreur de chargement du catalogue de caisse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Calcul dynamique des totaux
  const totalTTC = cart.reduce(
    (acc, item) => acc + item.produit.prix_vente * item.quantite,
    0
  );
  const montantHT = Math.round(totalTTC / 1.18);
  const tva = totalTTC - montantHT;

  // Calcul du montant reçu et de la monnaie
  const montantRecuNum = parseFloat(montantRecu) || 0;
  const monnaieARendre = Math.max(0, montantRecuNum - totalTTC);
  const estMontantSuffisant = modePaiement !== 'especes' || montantRecuNum >= totalTTC;

  // Scanner un produit par son code-barres
  const handleScanOrSubmitBarcode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scannedBarcode.trim()) return;

    const code = scannedBarcode.trim();
    const prod = produits.find(
      (p) => p.code_barre === code || p.nom.toLowerCase().includes(code.toLowerCase())
    );

    if (!prod) {
      toastWarning(`Aucun article trouvé pour le code : "${code}"`);
      return;
    }

    ajouterAuPanier(prod);
    setScannedBarcode('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const ajouterAuPanier = (produit: Produit) => {
    if (isVerrouillee) {
      toastError('La caisse est verrouillée. Impossible d\'enregistrer de nouveaux articles.');
      return;
    }

    if (produit.stock_actuel <= 0) {
      toastError(`Article "${produit.nom}" en rupture de stock.`);
      return;
    }

    playScannerBeep();
    setIsScanningAnimation(true);
    setTimeout(() => setIsScanningAnimation(false), 300);

    setCart((prev) => {
      const existing = prev.find((item) => item.produit.id === produit.id);
      if (existing) {
        if (existing.quantite >= produit.stock_actuel) {
          toastWarning(`Stock maximum atteint (${produit.stock_actuel} ${produit.unite_mesure}) pour cet article.`);
          return prev;
        }
        return prev.map((item) =>
          item.produit.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      }
      return [...prev, { produit, quantite: 1 }];
    });
  };

  const modifierQuantite = (produitId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.produit.id === produitId) {
            const nouvelleQte = item.quantite + delta;
            if (nouvelleQte <= 0) return null;
            if (nouvelleQte > item.produit.stock_actuel) {
              toastWarning(`Stock disponible limité à ${item.produit.stock_actuel}.`);
              return item;
            }
            return { ...item, quantite: nouvelleQte };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const supprimerLigne = (produitId: number) => {
    setCart((prev) => prev.filter((item) => item.produit.id !== produitId));
  };

  const viderPanier = () => {
    if (cart.length === 0) return;
    setCart([]);
    setMontantRecu('');
  };

  // Coupures rapides FCFA
  const appliquerCoupure = (valeur: number) => {
    setMontantRecu(valeur.toString());
  };

  // Validation de la vente et encaissement (avec Support Offline-First)
  const handleValiderEncaissement = async () => {
    if (isVerrouillee) {
      toastError('Opération impossible : la caisse est verrouillée.');
      return;
    }

    if (cart.length === 0) {
      toastError('Le panier est vide. Scannez au moins un article.');
      return;
    }

    if (modePaiement === 'especes' && montantRecuNum < totalTTC) {
      toastError(`Le montant remis (${formatFCFA(montantRecuNum)}) est inférieur au total de la commande (${formatFCFA(totalTTC)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const payloadLignes = cart.map((item) => ({
        produit_id: item.produit.id,
        quantite: item.quantite
      }));

      let venteResult: Vente;
      const clientNom = clients.find(c => c.id === selectedClientId)?.nom || 'Client au comptoir';

      if (!isOnline) {
        // Enregistrement Offline First dans IndexedDB
        await enregistrerVenteHorsLigne({
          client_id: selectedClientId || 0,
          client_nom: clientNom,
          vendeur_id: user ? user.id : 3,
          vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Caissier Molly Market',
          caisse_id: selectedCaisseId,
          mode_paiement: modePaiement,
          lignes: cart.map(i => ({
            produit_id: i.produit.id,
            nom: i.produit.nom,
            quantite: i.quantite,
            prix_unitaire: i.produit.prix_vente
          })),
          montant_total: totalTTC
        });

        venteResult = {
          id: Date.now(),
          numero_ticket: `TK-OFF-${Date.now().toString().slice(-6)}`,
          date_vente: new Date().toISOString(),
          client_id: selectedClientId || 0,
          client_nom: clientNom,
          vendeur_id: user ? user.id : 3,
          vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Caissier Molly Market',
          caisse_id: selectedCaisseId,
          statut: 'terminee',
          statut_paiement: 'paye',
          montant_total: totalTTC,
          lignes: cart.map((i, idx) => ({
            id: idx + 1,
            vente_id: 0,
            produit_id: i.produit.id,
            produit_nom: i.produit.nom,
            quantite: i.quantite,
            prix_unitaire: i.produit.prix_vente,
            montant_total: i.quantite * i.produit.prix_vente
          }))
        };

        toastWarning(
          `Vente enregistrée en MODE HORS-LIGNE (${venteResult.numero_ticket}) et sécurisée localement.`,
          'Encaissement Hors-Ligne'
        );
        rafraichirCompteur();
      } else {
        try {
          const res = await apiClient.effectuerVente({
            client_id: selectedClientId,
            lignes: payloadLignes,
            vendeur_id: user ? user.id : 3,
            vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Caissier Molly Market',
            mode_paiement: modePaiement,
            caisse_id: selectedCaisseId
          });
          venteResult = res.vente;
          toastSuccess(
            `Vente validée ! Ticket ${res.vente.numero_ticket} émis`,
            `Encaissement de ${formatFCFA(totalTTC)}`
          );
          await loadCatalog();
        } catch (networkErr: any) {
          // Fallback automatique offline si micro-coupure réseau
          await enregistrerVenteHorsLigne({
            client_id: selectedClientId || 0,
            client_nom: clientNom,
            vendeur_id: user ? user.id : 3,
            vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Caissier Molly Market',
            caisse_id: selectedCaisseId,
            mode_paiement: modePaiement,
            lignes: cart.map(i => ({
              produit_id: i.produit.id,
              nom: i.produit.nom,
              quantite: i.quantite,
              prix_unitaire: i.produit.prix_vente
            })),
            montant_total: totalTTC
          });

          venteResult = {
            id: Date.now(),
            numero_ticket: `TK-OFF-${Date.now().toString().slice(-6)}`,
            date_vente: new Date().toISOString(),
            client_id: selectedClientId || 0,
            client_nom: clientNom,
            vendeur_id: user ? user.id : 3,
            vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Caissier Molly Market',
            caisse_id: selectedCaisseId,
            statut: 'terminee',
            statut_paiement: 'paye',
            montant_total: totalTTC,
            lignes: cart.map((i, idx) => ({
              id: idx + 1,
              vente_id: 0,
              produit_id: i.produit.id,
              produit_nom: i.produit.nom,
              quantite: i.quantite,
              prix_unitaire: i.produit.prix_vente,
              montant_total: i.quantite * i.produit.prix_vente
            }))
          };

          toastWarning('Micro-coupure réseau : vente sauvegardée dans la file locale IndexedDB', 'Mode Hors-Ligne Automatique');
          rafraichirCompteur();
        }
      }

      setDerniereVente(venteResult);
      setMontantVerseAffiche(modePaiement === 'especes' ? montantRecuNum : totalTTC);
      setMonnaieRendueAffichee(modePaiement === 'especes' ? monnaieARendre : 0);
      setShowReceiptModal(true);

      // Réinitialiser le panier pour le prochain client
      setCart([]);
      setMontantRecu('');
      setSelectedClientId(null);

      if (onVenteComplete) onVenteComplete();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la validation de la vente');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrage des articles du catalogue
  const produitsFiltres = produits.filter((p) => {
    const matchCat = selectedCategorieId === 'tous' || p.categorie_id === selectedCategorieId;
    const matchSearch =
      searchQuery === '' ||
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code_barre.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Alerte si caisse verrouillée */}
      {isVerrouillee && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-900">
          <Lock className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Caisse Verrouillée : </span>
            La session de caisse a été soumise au Directeur pour validation. Les encaissements sont bloqués jusqu'à réouverture d'une nouvelle session.
          </div>
        </div>
      )}

      {/* Barre de Contrôle Caisse & Statut Réseau / Offline */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-800">
            <Layers className="w-4 h-4 text-[#2E7D32]" />
            <span>Terminal Actif :</span>
            <select
              value={selectedCaisseId}
              onChange={(e) => setSelectedCaisseId(Number(e.target.value))}
              className="bg-transparent font-bold text-[#2E7D32] focus:outline-none cursor-pointer"
            >
              {caisses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-neutral-500 hidden sm:block">
            Opérateur : <strong>{user?.prenom || 'Noam'} {user?.nom || 'Koffi'}</strong>
          </div>
        </div>

        {/* Badge Statut Connexion & File d'attente Hors-Ligne */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connecté au serveur</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Mode Hors-Ligne</span>
            </span>
          )}

          {nbEnAttente > 0 && (
            <button
              onClick={lancerSynchro}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Cliquer pour forcer la synchronisation avec le serveur"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{nbEnAttente} vente(s) à synchroniser</span>
            </button>
          )}
        </div>
      </div>

      {/* Interface Scanner & Caisse Supermarché */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE (7 cols) : Scanner & Catalogue Articles */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Barre de Scan Rapide & Recherche Code-Barre */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#2E7D32]">
                <ScanLine className="w-4 h-4" /> Lecteur Code-Barres / Scanner Caisse
              </span>
              <span className="text-neutral-400 font-normal">Entrée = scan instantané</span>
            </div>

            <form onSubmit={handleScanOrSubmitBarcode} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                  placeholder="Scannez ou tapez un code-barres (ex: 3017620422003, 3168930010265...)"
                  disabled={isVerrouillee}
                  className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${
                    isScanningAnimation ? 'border-[#2E7D32] bg-emerald-50 ring-2 ring-[#2E7D32]' : 'border-neutral-200'
                  }`}
                />
                <ScanLine className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isVerrouillee || !scannedBarcode.trim()}
                className="px-5 py-3 bg-[#2E7D32] hover:bg-emerald-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Scanner
              </button>
            </form>

            {/* Quick Demo Barcodes */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-neutral-400 shrink-0">Bip rapide :</span>
              {produits.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    ajouterAuPanier(p);
                  }}
                  disabled={isVerrouillee}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-emerald-50 hover:text-[#2E7D32] border border-neutral-200 rounded-lg shrink-0 font-mono transition-colors text-[11px]"
                  title={`Scanner ${p.nom}`}
                >
                  ⚡ {p.nom.slice(0, 15)}...
                </button>
              ))}
            </div>
          </div>

          {/* Rayons Supermarché (Catégories) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategorieId('tous')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategorieId === 'tous'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Tous les rayons ({produits.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorieId(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                  selectedCategorieId === cat.id
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Recherche textuelle catalogue */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par libellé ou mot-clé..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Grille des Articles du Rayon */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 flex-1 min-h-[360px] max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-neutral-400 text-sm">
                Chargement des articles...
              </div>
            ) : produitsFiltres.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-sm gap-2">
                <Package className="w-8 h-8 text-neutral-300" />
                Aucun article trouvé dans ce rayon
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {produitsFiltres.map((p) => {
                  const estEnRupture = p.stock_actuel <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !estEnRupture && ajouterAuPanier(p)}
                      className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        estEnRupture
                          ? 'border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed'
                          : 'border-neutral-200 bg-white hover:border-[#2E7D32] hover:shadow-md cursor-pointer group'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">
                          {p.code_barre}
                        </div>
                        <h4 className="font-semibold text-neutral-800 text-xs line-clamp-2 mt-0.5 group-hover:text-[#2E7D32]">
                          {p.nom}
                        </h4>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {p.unite_mesure}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-neutral-900">
                            {formatFCFA(p.prix_vente)}
                          </div>
                          <div
                            className={`text-[10px] ${
                              estEnRupture
                                ? 'text-red-500 font-bold'
                                : p.stock_actuel <= p.seuil_alerte
                                ? 'text-amber-600'
                                : 'text-neutral-400'
                            }`}
                          >
                            {estEnRupture ? 'Épuisé' : `Reste: ${p.stock_actuel}`}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={estEnRupture || isVerrouillee}
                          className="p-1.5 bg-neutral-100 group-hover:bg-[#2E7D32] group-hover:text-white rounded-lg transition-colors text-neutral-600 disabled:opacity-30"
                          title="Ajouter au ticket"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE (5 cols) : Ticket de Caisse en direct & Encaissement */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
            {/* Header du panier / caisse */}
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#2E7D32]" />
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Panier Client en Caisse</h3>
                  <p className="text-[11px] text-neutral-500">
                    {cart.reduce((s, i) => s + i.quantite, 0)} article(s) scanné(s)
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={viderPanier}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vider
                </button>
              )}
            </div>

            {/* Client Optionnel */}
            <div className="p-3 border-b border-neutral-100 bg-white">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>Client (Fidélité / Facturation) :</span>
                <span className="text-[10px] text-neutral-400">Optionnel</span>
              </div>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              >
                <option value="">Client au comptoir (Passager anonyme)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom} ({c.code_client})
                  </option>
                ))}
              </select>
            </div>

            {/* Liste des articles scannés */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[220px] max-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center text-neutral-400 text-xs gap-2">
                  <ScanLine className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
                  <span>Aucun article scanné pour le moment</span>
                  <span className="text-[11px] text-neutral-400">
                    Utilisez le scanner ou cliquez sur un produit du catalogue
                  </span>
                </div>
              ) : (
                cart.map((item) => {
                  const ligneTotal = item.produit.prix_vente * item.quantite;
                  return (
                    <div
                      key={item.produit.id}
                      className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-800 truncate">
                          {item.produit.nom}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {formatFCFA(item.produit.prix_vente)} / {item.produit.unite_mesure}
                        </div>
                      </div>

                      {/* Quantité +/- */}
                      <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => modifierQuantite(item.produit.id, -1)}
                          className="text-neutral-500 hover:text-neutral-900 p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold font-mono px-1 min-w-[20px] text-center">
                          {item.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => modifierQuantite(item.produit.id, 1)}
                          className="text-neutral-500 hover:text-neutral-900 p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Ligne */}
                      <div className="text-right min-w-[70px]">
                        <div className="font-bold text-neutral-900 font-mono">
                          {formatFCFA(ligneTotal)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => supprimerLigne(item.produit.id)}
                        className="text-neutral-300 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panneau Récapitulatif Financier POS */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-3">
              {/* Lignes Sous-Total et TVA */}
              <div className="space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Sous-total Hors Taxes (HT) :</span>
                  <span className="font-mono">{formatFCFA(montantHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA Supermarché (18%) :</span>
                  <span className="font-mono">{formatFCFA(tva)}</span>
                </div>
              </div>

              {/* GRAND TOTAL ENCAISSEMENT */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Total à Payer
                  </div>
                  <div className="text-2xl font-black text-[#2E7D32] font-mono">
                    {formatFCFA(totalTTC)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-emerald-700">
                  {cart.reduce((s, i) => s + i.quantite, 0)} articles
                </div>
              </div>

              {/* Mode de Règlement */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Moyen de paiement du client :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'especes', label: 'Espèces', isImage: false },
                    { id: 'wave', label: 'Wave', isImage: true, logo: '/images/wave_logo.png' },
                    { id: 'orange_money', label: 'Orange Money', isImage: true, logo: '/images/orange.png' },
                    { id: 'mtn_money', label: 'MTN MoMo', isImage: false },
                    { id: 'carte_bancaire', label: 'Carte Bancaire', isImage: false },
                    { id: 'cheque', label: 'Chèque', isImage: false }
                  ].map((m) => {
                    const active = modePaiement === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModePaiement(m.id as ModePaiement)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold shadow-xs ring-1 ring-[#2E7D32]'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                        }`}
                      >
                        {m.isImage ? (
                          <img
                            src={m.logo}
                            alt={m.label}
                            className="w-5 h-5 object-contain rounded-xs shrink-0"
                          />
                        ) : m.id === 'especes' ? (
                          <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : m.id === 'carte_bancaire' ? (
                          <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : m.id === 'mtn_money' ? (
                          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-black text-[8px] flex items-center justify-center shrink-0">
                            M
                          </span>
                        ) : (
                          <CreditCard className="w-4 h-4 text-neutral-500 shrink-0" />
                        )}
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zone Rendu de Monnaie si Espèces */}
              {modePaiement === 'especes' && (
                <div className="p-3 bg-white border border-neutral-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-700">
                      Montant reçu du client (FCFA) :
                    </label>
                    <button
                      type="button"
                      onClick={() => appliquerCoupure(totalTTC)}
                      className="text-[11px] text-[#2E7D32] font-bold hover:underline"
                    >
                      Montant exact
                    </button>
                  </div>

                  <input
                    type="number"
                    value={montantRecu}
                    onChange={(e) => setMontantRecu(e.target.value)}
                    placeholder="Saisir montant remis (ex: 20 000)"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />

                  {/* Boutons Coupures UEMOA rapides */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[1000, 2000, 5000, 10000, 20000, 50000].map((coupure) => (
                      <button
                        key={coupure}
                        type="button"
                        onClick={() => appliquerCoupure(coupure)}
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-[11px] font-mono text-neutral-700"
                      >
                        {formatFCFA(coupure)}
                      </button>
                    ))}
                  </div>

                  {/* Calcul de la Monnaie à Rendre */}
                  {montantRecuNum > 0 && (
                    <div
                      className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-bold ${
                        montantRecuNum >= totalTTC
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span>
                        {montantRecuNum >= totalTTC
                          ? 'Monnaie à rendre au client :'
                          : 'Montant insuffisant :'}
                      </span>
                      <span className="text-sm font-mono">
                        {montantRecuNum >= totalTTC
                          ? formatFCFA(monnaieARendre)
                          : `Manque ${formatFCFA(totalTTC - montantRecuNum)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bouton de Validation de l'Encaissement */}
              <button
                type="button"
                onClick={handleValiderEncaissement}
                disabled={isVerrouillee || cart.length === 0 || !estMontantSuffisant || submitting}
                className="w-full py-3.5 bg-[#2E7D32] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <>Validation en cours...</>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Valider l'encaissement & Imprimer le ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TICKET DE CAISSE THERMIQUE SUPERMARCHÉ */}
      {showReceiptModal && derniereVente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm">Vente enregistrée avec succès</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* FORMAT RÉALISTE TICKET DE CAISSE THERMIQUE */}
            <div className="p-6 bg-neutral-50 overflow-y-auto max-h-[70vh]">
              <div className="bg-white p-6 shadow-sm border border-neutral-200 rounded font-mono text-xs text-neutral-800 space-y-3">
                {/* En-tête Enseigne */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-300">
                  <div className="text-lg font-extrabold tracking-wider text-neutral-900">
                    MOLLY MARKET
                  </div>
                  <div className="text-[11px] text-neutral-500">SUPERMARCHÉ LIBRE-SERVICE</div>
                  <div className="text-[11px] text-neutral-500">Boulevard de la République, Abidjan Plateau</div>
                  <div className="text-[11px] text-neutral-500">Tél : +225 27 20 22 00 00 / RCCM CI-ABJ-2024-B-1234</div>
                </div>

                {/* Métadonnées Ticket */}
                <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-neutral-300">
                  <div className="flex justify-between">
                    <span>Ticket N° :</span>
                    <span className="font-bold">{derniereVente.numero_ticket}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date / Heure :</span>
                    <span>{derniereVente.date_vente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Caissier :</span>
                    <span>{derniereVente.vendeur_nom || 'Noam Koffi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client :</span>
                    <span>{derniereVente.client_nom || 'Client au comptoir'}</span>
                  </div>
                </div>

                {/* Lignes d'articles */}
                <div className="space-y-1.5 py-2 border-b border-dashed border-neutral-300">
                  <div className="flex justify-between text-[11px] font-bold text-neutral-500 pb-1">
                    <span>ARTICLE / QTÉ</span>
                    <span>TOTAL</span>
                  </div>
                  {derniereVente.lignes.map((l, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold truncate">{l.produit_nom}</div>
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>
                          {l.quantite} x {formatFCFA(l.prix_unitaire)}
                        </span>
                        <span className="font-bold text-neutral-800">
                          {formatFCFA(l.quantite * l.prix_unitaire)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux & Rendu de monnaie */}
                <div className="space-y-1 py-2 border-b border-dashed border-neutral-300 text-[11px]">
                  <div className="flex justify-between">
                    <span>Sous-total HT :</span>
                    <span>{formatFCFA(Math.round(derniereVente.montant_total / 1.18))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA (18%) :</span>
                    <span>
                      {formatFCFA(derniereVente.montant_total - Math.round(derniereVente.montant_total / 1.18))}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>TOTAL TTC :</span>
                    <span>{formatFCFA(derniereVente.montant_total)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Mode de règlement :</span>
                    <span className="uppercase font-semibold">{modePaiement}</span>
                  </div>
                  {montantVerseAffiche > 0 && (
                    <div className="flex justify-between">
                      <span>Montant versé :</span>
                      <span>{formatFCFA(montantVerseAffiche)}</span>
                    </div>
                  )}
                  {monnaieRendueAffichee > 0 && (
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Monnaie rendue :</span>
                      <span>{formatFCFA(monnaieRendueAffichee)}</span>
                    </div>
                  )}
                </div>

                {/* Code-barres simulé ticket & Message de remerciement */}
                <div className="text-center pt-3 space-y-2">
                  <div className="text-xs font-bold tracking-widest py-1 border-y border-neutral-300 font-mono">
                    ||| | |||| | ||| || |||||| | ||||| | ||
                  </div>
                  <div className="text-[11px] text-neutral-500 italic">
                    Merci de votre visite et à très bientôt chez Molly Market !
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Reçu */}
            <div className="p-4 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const caisseNom = caisses.find(c => c.id === selectedCaisseId)?.nom || 'Caisse Principale N°1';
                    imprimerTicketThermiqueDOM({
                      numero_ticket: derniereVente.numero_ticket,
                      date_vente: derniereVente.date_vente,
                      vendeur_nom: derniereVente.vendeur_nom || (user ? `${user.prenom} ${user.nom}` : 'Noam Koffi'),
                      caisse_nom: caisseNom,
                      client_nom: derniereVente.client_nom,
                      mode_paiement: modePaiement,
                      montant_total: derniereVente.montant_total,
                      montant_recu: montantVerseAffiche,
                      monnaie_rendue: monnaieRendueAffichee,
                      lignes: derniereVente.lignes.map(l => ({
                        produit_nom: l.produit_nom,
                        quantite: l.quantite,
                        prix_unitaire: l.prix_unitaire,
                        montant_total: l.montant_total
                      }))
                    });
                  }}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Impression Thermique 80mm (ESC/POS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Standard / PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2.5 bg-[#2E7D32] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <span>Client suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
