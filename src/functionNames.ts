export enum cloudFunctionNames {
  createUser = 'createUser',
  createAdmin = 'createUser',
  createSuperAdmin = 'createUser',
  updateUser = 'updateUser',
  confirmSale = 'confirmSale',
  confirmTransfer = 'confirmTransfer',
  listUsers = 'listUsers',
  resetPassword = 'resetPassword',
  verifyEmail = 'verifyEmail',
  generateInvoicePDF = 'generateInvoicePDF',
  switchToAccount = 'switchToAccount',
  switchFromAccount = 'switchFromAccount',
}

// const cloudFunctionNames: CloudFunctionNames = {
//   createUser: 'createUser',
//   createAdmin: 'createUser',
//   createSuperAdmin: 'createUser',
//   confirmSale: 'confirmSale',
//   listUsers: 'listUsers',
// };
export default cloudFunctionNames;
