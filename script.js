const products = [
  { id: "cow-milk", name: "गायीचे दूध", unit: "लिटर", rate: 65, note: "ताजे आणि हलके", icon: "🐄" },
  { id: "buffalo-milk", name: "म्हशीचे दूध", unit: "लिटर", rate: 85, note: "घट्ट आणि पौष्टिक", icon: "🐃" },
  { id: "mixed-milk", name: "मिक्स दूध", unit: "लिटर", rate: 75, note: "दररोजच्या वापरासाठी", icon: "🥛" },
  { id: "curd", name: "दही", unit: "किलो", rate: 90, note: "घरगुती चव", icon: "🍶" },
  { id: "paneer", name: "पनीर", unit: "किलो", rate: 360, note: "ताजे पनीर", icon: "🧀" },
  { id: "ghee", name: "तूप", unit: "किलो", rate: 720, note: "शुद्ध देशी तूप", icon: "🫙" },
];

const storageKey = "aaplaDudhOrders";
const profileKey = "aaplaDudhProfile";
const screens = {
  language: document.querySelector("#languageScreen"),
  video: document.querySelector("#videoScreen"),
  auth: document.querySelector("#authScreen"),
  app: document.querySelector("#mainApp"),
};
const tabs = document.querySelectorAll(".tab[data-tab]");
const panels = document.querySelectorAll(".tab-panel");
const productGrid = document.querySelector("#productGrid");
const cartList = document.querySelector("#cartList");
const cartTotal = document.querySelector("#cartTotal");
const ordersList = document.querySelector("#ordersList");
const profileStrip = document.querySelector("#profileStrip");
const success = document.querySelector("#success");
const authError = document.querySelector("#authError");
const summary = {
  name: document.querySelector("#sName"),
  phone: document.querySelector("#sPhone"),
  items: document.querySelector("#sItems"),
  total: document.querySelector("#sTotal"),
};

let cart = [];
let currentUser = null;
let currentRole = "customer";

function formatMoney(value) {
  return `₹${value}`;
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function showTab(id) {
  if (id === "admin" && currentRole !== "admin") return;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === id));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === id));
  if (id === "admin") renderOrders();
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
}

function cartQuantity() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartAmount() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + product.rate * item.qty;
  }, 0);
}

function renderProducts() {
  productGrid.innerHTML = products.map((product) => `
    <article class="product-tile">
      <div class="product-icon">${product.icon}</div>
      <div>
        <h3>${product.name}</h3>
        <p>${product.note}</p>
      </div>
      <div class="product-footer">
        <strong>${formatMoney(product.rate)} / ${product.unit}</strong>
        <button type="button" class="add-btn" data-add="${product.id}">Add to cart</button>
      </div>
    </article>
  `).join("");
}

function renderProfile() {
  if (!currentUser) {
    profileStrip.innerHTML = "";
    return;
  }
  const photo = currentUser.photo
    ? `<img src="${currentUser.photo}" alt="${currentUser.name}" />`
    : `<span class="avatar-fallback">${currentUser.name.slice(0, 1).toUpperCase()}</span>`;
  profileStrip.innerHTML = `
    <div class="profile-avatar">${photo}</div>
    <div>
      <strong>${currentUser.name}</strong>
      <p>${currentUser.phone} · ${currentUser.address}</p>
    </div>
  `;
}

function renderCart() {
  document.querySelector("#cartCount").textContent = cartQuantity();
  cartTotal.textContent = formatMoney(cartAmount());

  if (cart.length === 0) {
    cartList.innerHTML = `<p class="empty-state">Cart मध्ये अजून product नाही.</p>`;
  } else {
    cartList.innerHTML = cart.map((item) => {
      const product = getProduct(item.id);
      return `
        <article class="cart-item">
          <div>
            <h3>${product.name}</h3>
            <p>${formatMoney(product.rate)} / ${product.unit}</p>
          </div>
          <div class="cart-controls">
            <button type="button" data-dec="${product.id}">-</button>
            <strong>${item.qty}</strong>
            <button type="button" data-inc="${product.id}">+</button>
            <button type="button" class="remove" data-remove="${product.id}">Remove</button>
          </div>
        </article>
      `;
    }).join("");
  }

  updateSummary();
}

function updateSummary() {
  summary.name.textContent = currentUser?.name || "-";
  summary.phone.textContent = currentUser?.phone || "-";
  summary.items.textContent = `${cartQuantity()} item`;
  summary.total.textContent = formatMoney(cartAmount());
}

function addToCart(productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (item) item.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  renderCart();
}

function changeQuantity(productId, delta) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((entry) => entry.id !== productId);
  renderCart();
}

function savedOrders() {
  return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveOrder(order) {
  const orders = savedOrders();
  orders.unshift(order);
  localStorage.setItem(storageKey, JSON.stringify(orders));
}

function renderOrders() {
  const orders = savedOrders();
  if (orders.length === 0) {
    ordersList.innerHTML = `<p class="empty-state">अजून order आलेली नाही.</p>`;
    return;
  }

  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-head">
        <strong>${order.customer.name}</strong>
        <span>${order.createdAt}</span>
      </div>
      <p><b>फोन:</b> ${order.customer.phone}</p>
      <p><b>पत्ता:</b> ${order.customer.address}</p>
      <ul>
        ${order.items.map((item) => `<li>${item.name} - ${item.qty} ${item.unit} = ${formatMoney(item.amount)}</li>`).join("")}
      </ul>
      <div class="order-total">
        <span>${order.payment}</span>
        <strong>${formatMoney(order.total)}</strong>
      </div>
    </article>
  `).join("");
}

function setRole(role) {
  currentRole = role;
  document.querySelectorAll(".admin-only").forEach((item) => {
    item.classList.toggle("hidden", role !== "admin");
  });
}

function enterApp(role, user) {
  setRole(role);
  currentUser = user;
  if (role === "customer") {
    localStorage.setItem(profileKey, JSON.stringify(user));
  }
  renderProfile();
  renderCart();
  renderOrders();
  showScreen("app");
  showTab(role === "admin" ? "admin" : "home");
}

function validateCustomer(user) {
  if (!user.name) return "कृपया नाव भरा.";
  if (!user.phone) return "कृपया मोबाइल नंबर भरा.";
  if (!user.address) return "कृपया पत्ता भरा.";
  return "";
}

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => {
    localStorage.setItem("aaplaDudhLanguage", button.dataset.language);
    showScreen("video");
  });
});

document.querySelector("#continueToLogin").addEventListener("click", () => {
  showScreen("auth");
});

document.querySelectorAll(".auth-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach((form) => form.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.authMode}Auth`).classList.add("active");
    authError.textContent = "";
  });
});

document.querySelector("#customerLogin").addEventListener("click", () => {
  const user = {
    name: document.querySelector("#signupName").value.trim(),
    phone: document.querySelector("#signupPhone").value.trim(),
    address: document.querySelector("#signupAddress").value.trim(),
    photo: "",
  };
  const photoFile = document.querySelector("#signupPhoto").files[0];
  const error = validateCustomer(user);
  if (error) {
    authError.textContent = error;
    return;
  }
  if (!photoFile) {
    enterApp("customer", user);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    user.photo = reader.result;
    enterApp("customer", user);
  };
  reader.readAsDataURL(photoFile);
});

document.querySelector("#adminLogin").addEventListener("click", () => {
  const phone = document.querySelector("#adminPhone").value.trim() || "Admin";
  const pin = document.querySelector("#adminPin").value.trim();
  if (pin !== "1234") {
    authError.textContent = "Admin PIN चुकीचा आहे.";
    return;
  }
  enterApp("admin", { name: "Admin", phone, address: "Admin dashboard", photo: "" });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.next));
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  addToCart(button.dataset.add);
  showTab("cart");
});

cartList.addEventListener("click", (event) => {
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  const remove = event.target.closest("[data-remove]");
  if (inc) changeQuantity(inc.dataset.inc, 1);
  if (dec) changeQuantity(dec.dataset.dec, -1);
  if (remove) {
    cart = cart.filter((entry) => entry.id !== remove.dataset.remove);
    renderCart();
  }
});

document.querySelector("#confirm").addEventListener("click", () => {
  if (cart.length === 0) {
    success.textContent = "कृपया product cart मध्ये add करा.";
    success.classList.add("error");
    return;
  }

  const payment = document.querySelector("input[name='payment']:checked").value;
  const order = {
    id: Date.now(),
    createdAt: new Date().toLocaleString("mr-IN"),
    customer: currentUser,
    payment,
    items: cart.map((item) => {
      const product = getProduct(item.id);
      return {
        name: product.name,
        unit: product.unit,
        qty: item.qty,
        rate: product.rate,
        amount: product.rate * item.qty,
      };
    }),
    total: cartAmount(),
  };

  saveOrder(order);
  cart = [];
  renderCart();
  success.classList.remove("error");
  success.textContent = "Order confirm झाली. Admin ला order दिसेल.";
  showTab("home");
});

document.querySelector("#refreshOrders").addEventListener("click", renderOrders);

document.querySelector("#clearOrders").addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderOrders();
});

document.querySelector("#logout").addEventListener("click", () => {
  cart = [];
  currentUser = null;
  currentRole = "customer";
  renderCart();
  showScreen("auth");
});

renderProducts();
renderCart();
showScreen("language");
