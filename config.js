// Paste the HTTP POST URLs of your Power Automate flows here (see README.md).
// Leave a value empty to run in demo mode (sample data + browser storage).
window.CONFIG = {
  api: {
    products: "",  // flow: reads SharePoint list "Products", returns JSON array
    register: "",  // flow: creates item in "Customers"
    login: "",     // flow: checks "Customers", returns {name,email} or {error}
    order: ""      // flow: creates item in "Orders"
  }
};
