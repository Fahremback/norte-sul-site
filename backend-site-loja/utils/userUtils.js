// backend-site-loja/utils/userUtils.js

/**
 * Transforms a user object from the database format to a frontend-friendly format.
 * It removes sensitive fields, preserves the `isAdmin` boolean for the main website,
 * and adds a `role` string for the management system.
 * @param {object | null} user - The user object from Prisma.
 * @returns {object | null} The transformed user object safe to send to the client.
 */
function transformUserForFrontend(user) {
  if (!user) return null;

  // Destructure to remove sensitive fields we NEVER want to send to the client.
  // We leave `isAdmin` in the `rest` object by not destructuring it out.
  const { 
    password, 
    verificationToken, 
    verificationTokenExpires, 
    passwordResetToken, 
    passwordResetTokenExpires, 
    asaasCustomerId,
    ...rest 
  } = user;
  
  // Return the rest of the user data, including the `isAdmin` boolean,
  // and add the `role` property for compatibility with the management system.
  return {
    ...rest, // This will now include the `isAdmin` boolean field
    role: user.isAdmin ? 'admin' : 'user',
  };
}

module.exports = {
  transformUserForFrontend
};
