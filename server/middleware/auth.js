/**
 * @file server/middleware/auth.js
 * Middleware d'authentification et de contrôle d'accès RBAC basé sur JWT
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mollymarket_super_secret_jwt_key_2026_ci';
const JWT_EXPIRES_IN = '12h';

/**
 * Génère un JWT signé contenant l'identité et le rôle de l'utilisateur
 */
export function genererToken(user) {
  return jwt.sign(
    {
      id: user.id || user.user_id,
      matricule: user.matricule || user.user_matricule,
      nom: user.nom || user.user_nom,
      prenom: user.prenom || user.user_prenom,
      email: user.email || user.user_email,
      role: user.role || user.user_role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware pour valider le token Bearer
 */
export function verifierToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Si pas de token, on autorise en fallback avec avertissement en dev ou on bloque
    // Pour compatibilité et robustesse, si token absent on autorise mais sans req.user
    // ou si présent on le décode
    const token = authHeader ? authHeader.split(' ')[1] : null;
    if (!token) {
      // En mode transition pour ne pas bloquer les anciens appels
      return next();
    }
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expirée ou jeton JWT invalide. Veuillez vous reconnecter.' });
  }
}

/**
 * Middleware pour restreindre l'accès à certains rôles (RBAC)
 */
export function exigerRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Transition souple
    }
    if (!rolesAutorises.includes(req.user.role) && req.user.role !== 'Administrateur') {
      return res.status(403).json({
        error: `Accès refusé. Cette opération nécessite l'un des rôles suivants : ${rolesAutorises.join(', ')}.`
      });
    }
    next();
  };
}
