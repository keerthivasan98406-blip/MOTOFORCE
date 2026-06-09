// owner.js

function showToast(message, duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ========== TABS FUNCTIONALITY ==========
const tabButtons = {
  add: document.getElementById('tab-add'),
  manage: document.getElementById('tab-manage'),
  orders: document.getElementById('tab-orders')
};

const tabSections = {
  add: document.getElementById('section-add'),
  manage: document.getElementById('section-manage'),
  orders: document.getElementById('section-orders')
};

function switchTab(activeKey) {
  Object.keys(tabButtons).forEach(key => {
    if (key === activeKey) {
      tabButtons[key].classList.add('active');
      tabSections[key].style.display = 'block';
    } else {
      tabButtons[key].classList.remove('active');
      tabSections[key].style.display = 'none';
    }
  });

  // Re-render corresponding sections
  if (activeKey === 'manage') renderManageProducts();
  if (activeKey === 'orders') renderOrders();
}

tabButtons.add.addEventListener('click', () => switchTab('add'));
tabButtons.manage.addEventListener('click', () => switchTab('manage'));
tabButtons.orders.addEventListener('click', () => switchTab('orders'));

// ========== PRODUCT SUBMISSION (ADD/EDIT) ==========
const addProductForm = document.getElementById('add-product-form');
const editProdIdInput = document.getElementById('edit-prod-id');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitBtn = document.getElementById('submit-btn');

addProductForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const brand = document.getElementById('prod-brand').value.trim();
  const price = parseInt(document.getElementById('prod-price').value, 10);
  const oldPriceVal = document.getElementById('prod-old-price').value;
  const oldPrice = oldPriceVal ? parseInt(oldPriceVal, 10) : null;
  const category = document.getElementById('prod-category').value;
  const rating = parseFloat(document.getElementById('prod-rating').value) || 5;
  const image = document.getElementById('prod-image').value.trim();
  const image2 = document.getElementById('prod-image-2').value.trim() || '';
  const badge = document.getElementById('prod-badge').value;

  if (!name || !brand || !price || !category || !image) {
    showToast('❌ Please fill all required fields');
    return;
  }

  // Calculate discount if old price exists
  let discount = null;
  if (oldPrice && oldPrice > price) {
    discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  const editId = editProdIdInput.value;
  let ownerProducts = JSON.parse(localStorage.getItem('owner_products') || '[]');

  if (editId) {
    // EDIT MODE
    const index = ownerProducts.findIndex(p => p.id === editId);
    if (index !== -1) {
      ownerProducts[index] = {
        id: editId,
        name,
        brand,
        price,
        oldPrice,
        discount,
        category,
        rating,
        image,
        image2,
        badge
      };
      localStorage.setItem('owner_products', JSON.stringify(ownerProducts));
      showToast('✅ Product updated successfully!');
    } else {
      showToast('❌ Product to edit not found!');
    }
    
    // Reset form modes
    resetFormMode();
  } else {
    // ADD MODE
    const id = 'custom-' + Date.now();
    const newProduct = {
      id,
      name,
      brand,
      price,
      oldPrice,
      discount,
      category,
      rating,
      image,
      image2,
      badge
    };
    ownerProducts.unshift(newProduct);
    localStorage.setItem('owner_products', JSON.stringify(ownerProducts));
    showToast('✅ Product added successfully!');
  }

  // Reset form inputs
  addProductForm.reset();
  document.getElementById('prod-rating').value = 5;
  
  // Return to manage tab if we edited
  if (editId) {
    switchTab('manage');
  }
});

function resetFormMode() {
  editProdIdInput.value = '';
  formTitle.innerHTML = 'Add New <span>Product</span>';
  formSubtitle.textContent = 'Fill in the details to publish a new product to the storefront.';
  submitBtn.textContent = 'Publish Product';
}

// ========== MANAGE PRODUCTS LISTING ==========
function renderManageProducts() {
  const productsList = document.getElementById('owner-products-list');
  if (!productsList) return;

  const ownerProducts = JSON.parse(localStorage.getItem('owner_products') || '[]');

  if (ownerProducts.length === 0) {
    productsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 24px 0;">No custom products added yet.</p>`;
    return;
  }

  productsList.innerHTML = '';
  ownerProducts.forEach(prod => {
    const item = document.createElement('div');
    item.className = 'owner-product-item';
    item.innerHTML = `
      <div class="owner-product-info">
        <img src="${prod.image}" alt="${prod.name}" class="owner-product-thumb" onerror="this.src='hero2.png'">
        <div class="owner-product-details">
          <h4>${prod.name}</h4>
          <span>${prod.brand} | ₹${prod.price.toLocaleString('en-IN')} | Category: ${prod.category}</span>
        </div>
      </div>
      <div class="owner-product-actions">
        <button class="btn-edit" data-id="${prod.id}">Edit</button>
        <button class="btn-delete" data-id="${prod.id}">Delete</button>
      </div>
    `;

    // Bind Edit Action
    item.querySelector('.btn-edit').addEventListener('click', () => {
      startEditProduct(prod);
    });

    // Bind Delete Action
    item.querySelector('.btn-delete').addEventListener('click', () => {
      deleteProduct(prod.id);
    });

    productsList.appendChild(item);
  });
}

function startEditProduct(prod) {
  editProdIdInput.value = prod.id;
  formTitle.innerHTML = 'Edit <span>Product</span>';
  formSubtitle.textContent = `Modifying details for product: ${prod.name}`;
  submitBtn.textContent = 'Update Product';

  document.getElementById('prod-name').value = prod.name;
  document.getElementById('prod-brand').value = prod.brand;
  document.getElementById('prod-price').value = prod.price;
  document.getElementById('prod-old-price').value = prod.oldPrice || '';
  document.getElementById('prod-category').value = prod.category;
  document.getElementById('prod-rating').value = prod.rating;
  document.getElementById('prod-image').value = prod.image;
  document.getElementById('prod-image-2').value = prod.image2 || '';
  document.getElementById('prod-badge').value = prod.badge || '';

  // Scroll/Switch to form tab
  switchTab('add');
}

function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  let ownerProducts = JSON.parse(localStorage.getItem('owner_products') || '[]');
  ownerProducts = ownerProducts.filter(p => p.id !== id);
  localStorage.setItem('owner_products', JSON.stringify(ownerProducts));
  showToast('🗑️ Product deleted successfully!');
  renderManageProducts();
}

// ========== INCOMING ORDERS LISTING ==========
function renderOrders() {
  const ordersList = document.getElementById('owner-orders-list');
  if (!ordersList) return;

  const orders = JSON.parse(localStorage.getItem('moto_orders') || '[]');

  if (orders.length === 0) {
    ordersList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 24px 0;">No orders placed yet.</p>`;
    return;
  }

  ordersList.innerHTML = '';
  orders.forEach((order, index) => {
    const card = document.createElement('div');
    card.className = 'owner-order-card';
    
    // Generate Items HTML list
    const itemsHtml = order.items.map(item => `
      <div class="order-item-row">
        <span>${item.name} <strong>×${item.qty}</strong></span>
        <span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
      </div>
    `).join('');

    const statusClass = order.status.toLowerCase() === 'pending' 
      ? 'status-pending' 
      : (order.status.toLowerCase() === 'shipped' 
        ? 'status-shipped' 
        : (order.status.toLowerCase() === 'confirmed' ? 'status-completed' : 'status-completed'));

    // Check for payment screenshot
    const screenshotHtml = order.customer.screenshot ? `
      <div class="order-payment-screenshot" style="margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 12px;">
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;"><strong>Payment Screenshot:</strong></p>
        <img src="${order.customer.screenshot}" alt="Payment Screenshot" class="order-screenshot-thumb" style="cursor: pointer; max-width: 100px; border-radius: 4px;">
      </div>
    ` : '';

    // Action button depends on status
    const actionBtnHtml = order.status.toLowerCase() === 'pending'
      ? `<button class="btn-confirm-order" data-idx="${index}">Confirm Order ✓</button>`
      : `<button class="btn-status-toggle" data-idx="${index}">Update Status</button>`;

    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-id">Order ID: ${order.id}</span>
        <span class="order-date">${order.date}</span>
      </div>
      <div class="order-details-grid">
        <div class="order-cust-info">
          <h4>Customer Info</h4>
          <p><strong>Name:</strong> ${order.customer.name}</p>
          <p><strong>Email:</strong> ${order.customer.email}</p>
          <p><strong>Phone:</strong> ${order.customer.phone}</p>
          <p><strong>Pay Method:</strong> ${order.customer.payment}</p>
          <p><strong>Address:</strong> ${order.customer.address}</p>
          ${screenshotHtml}
        </div>
        <div class="order-items-info">
          <h4>Items Summary</h4>
          ${itemsHtml}
          <div class="order-total-row">
            <span>Total:</span>
            <span>₹${order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <div class="order-footer">
        <div>
          Status: <span class="order-status ${statusClass}">${order.status}</span>
        </div>
        <div class="order-actions">
          ${actionBtnHtml}
          <button class="btn-delete-order" data-idx="${index}">Delete</button>
        </div>
      </div>
    `;

    // Bind Status Toggle / Direct Confirm
    const actionBtn = card.querySelector('.btn-status-toggle, .btn-confirm-order');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        if (order.status.toLowerCase() === 'pending') {
          updateOrderStatusDirect(index, 'Confirmed');
        } else {
          toggleOrderStatus(index);
        }
      });
    }

    // Bind Delete Order
    card.querySelector('.btn-delete-order').addEventListener('click', () => {
      deleteOrder(index);
    });

    // Bind Screenshot Lightbox Click
    if (order.customer.screenshot) {
      const thumb = card.querySelector('.order-screenshot-thumb');
      if (thumb) {
        thumb.addEventListener('click', () => {
          const modal = document.getElementById('screenshot-modal');
          const modalImg = document.getElementById('screenshot-modal-img');
          if (modal && modalImg) {
            modalImg.src = order.customer.screenshot;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        });
      }
    }

    ordersList.appendChild(card);
  });
}

function updateOrderStatusDirect(index, status) {
  let orders = JSON.parse(localStorage.getItem('moto_orders') || '[]');
  orders[index].status = status;
  localStorage.setItem('moto_orders', JSON.stringify(orders));
  showToast(`✅ Order status updated to: ${status}`);
  renderOrders();
}

function toggleOrderStatus(index) {
  let orders = JSON.parse(localStorage.getItem('moto_orders') || '[]');
  const currentStatus = orders[index].status;
  let nextStatus = 'Pending';
  
  if (currentStatus === 'Pending') nextStatus = 'Confirmed';
  else if (currentStatus === 'Confirmed') nextStatus = 'Shipped';
  else if (currentStatus === 'Shipped') nextStatus = 'Completed';
  else nextStatus = 'Pending';

  orders[index].status = nextStatus;
  localStorage.setItem('moto_orders', JSON.stringify(orders));
  showToast(`🚚 Order status updated to: ${nextStatus}`);
  renderOrders();
}

function deleteOrder(index) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  
  let orders = JSON.parse(localStorage.getItem('moto_orders') || '[]');
  orders.splice(index, 1);
  localStorage.setItem('moto_orders', JSON.stringify(orders));
  showToast('🗑️ Order removed from logs!');
  renderOrders();
}

// ========== SCREENSHOT LIGHTBOX EVENT LISTENERS ==========
const screenshotModal = document.getElementById('screenshot-modal');
const screenshotModalClose = document.getElementById('screenshot-modal-close');

if (screenshotModal && screenshotModalClose) {
  screenshotModalClose.addEventListener('click', () => {
    screenshotModal.classList.remove('active');
    document.body.style.overflow = '';
  });
  screenshotModal.addEventListener('click', (e) => {
    if (e.target === screenshotModal) {
      screenshotModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && screenshotModal.classList.contains('active')) {
      screenshotModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}
