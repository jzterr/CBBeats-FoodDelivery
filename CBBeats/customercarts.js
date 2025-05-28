document.addEventListener("DOMContentLoaded", function() {
  /* ============================
     Sidebar & Panel Toggles
  ============================ */
  const homeButton = document.getElementById('homeButton');
  const cartButton = document.getElementById('cartButton');
  const historyButton = document.getElementById('historyButton');

  // Panels: Home (dish + order summary), Cart, History.
  const homePanel = document.getElementById('homePanel');
  const cartPanel = document.getElementById('cartPanel');
  const historyPanel = document.getElementById('historyContainer');

  if (!homeButton || !cartButton || !historyButton || !homePanel || !cartPanel || !historyPanel) {
    console.error("One or more required elements are missing.");
    return;
  }

  function hideAllPanels() {
    homePanel.style.display = 'none';
    cartPanel.style.display = 'none';
    historyPanel.style.display = 'none';
  }

  function showPanel(panel, displayType = 'block') {
    hideAllPanels();
    panel.style.display = displayType;
  }

  homeButton.addEventListener('click', () => {
    showPanel(homePanel, 'flex'); // Use flex for home panel layout
  });
  cartButton.addEventListener('click', () => {
    showPanel(cartPanel, 'block');
  });
  historyButton.addEventListener('click', () => {
    showPanel(historyPanel, 'block');
  });

  /* ============================
     Cart Panel Functionality
  ============================ */
  function updateCartTotal() {
    const cartItems = document.querySelectorAll('#cartPanel .cart-item');
    let total = 0;
    cartItems.forEach(item => {
      const checkbox = item.querySelector('.item-select');
      if (checkbox && checkbox.checked) {
        const price = parseFloat(item.getAttribute('data-price')) || 0;
        const qty = parseInt(item.querySelector('.qty-value').textContent) || 1;
        total += price * qty;
      }
    });
    const totalEl = document.querySelector('#cartPanel .total-amount');
    if (totalEl) {
      totalEl.textContent = "₱" + total.toFixed(2);
    }
  }

  function attachCartItemEvents(cartItem) {
    const minusBtn = cartItem.querySelector('.qty-btn.minus');
    const plusBtn = cartItem.querySelector('.qty-btn.plus');
    const removeBtn = cartItem.querySelector('.remove-btn');
    const checkbox = cartItem.querySelector('.item-select');

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        const qtyEl = cartItem.querySelector('.qty-value');
        let qty = parseInt(qtyEl.textContent);
        qtyEl.textContent = qty + 1;
        updateCartTotal();
      });
    }
    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        const qtyEl = cartItem.querySelector('.qty-value');
        let qty = parseInt(qtyEl.textContent);
        if (qty > 1) {
          qtyEl.textContent = qty - 1;
          updateCartTotal();
        }
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        cartItem.remove();
        updateCartTotal();
        const cartItemsContainer = document.querySelector('#cartPanel .cart-items');
        if (cartItemsContainer && cartItemsContainer.children.length === 0) {
          cartItemsContainer.innerHTML = '<p class="empty-message">No items in your cart.</p>';
        }
      });
    }
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        updateCartTotal();
      });
    }
  }

  document.querySelectorAll('#cartPanel .cart-item').forEach(item => {
    attachCartItemEvents(item);
  });
  updateCartTotal();

  // Expose addCartItem globally
  function addCartItem(name, img, price) {
    const cartItemsContainer = document.querySelector('#cartPanel .cart-items');
    if (!cartItemsContainer) return;
    const emptyMessage = cartItemsContainer.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();
    let existingItem = cartItemsContainer.querySelector(`.cart-item[data-name="${name}"]`);
    if (existingItem) {
      const qtyEl = existingItem.querySelector('.qty-value');
      let qty = parseInt(qtyEl.textContent);
      qtyEl.textContent = qty + 1;
    } else {
      let imagePath = img;
      if (!img.startsWith("data:") && !img.startsWith("http") && !img.startsWith("/") && !img.startsWith("../")) {
        imagePath = "../images/" + img;
      }
      const cartItem = document.createElement('div');
      cartItem.classList.add('cart-item');
      cartItem.setAttribute('data-name', name);
      cartItem.setAttribute('data-price', price);
      cartItem.innerHTML = `
        <div class="item-checkbox">
          <input type="checkbox" class="item-select" checked>
        </div>
        <div class="item-image">
          <img src="${imagePath}" alt="${name}">
        </div>
        <div class="item-details">
          <h3 class="item-title">${name}</h3>
          <p class="item-price" data-price="${price}">₱${price}</p>
          <div class="quantity-controls">
            <button class="qty-btn minus">−</button>
            <span class="qty-value">1</span>
            <button class="qty-btn plus">+</button>
          </div>
        </div>
        <div class="item-remove">
          <button class="remove-btn">×</button>
        </div>
      `;
      cartItemsContainer.appendChild(cartItem);
      attachCartItemEvents(cartItem);
    }
    updateCartTotal();
  }
  window.addCartItem = addCartItem;

  /* ====================================================
     Attach event listener to add-to-cart buttons
  ==================================================== */
  document.querySelectorAll('.add-to-cart-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const dish = this.closest('.dish');
      if (!dish) return;
      const name = dish.getAttribute('data-name');
      let img = dish.getAttribute('data-img') || dish.querySelector('img').getAttribute('src');
      const price = dish.getAttribute('data-price');
      addCartItem(name, img, price);
      showToast(`${name} has been added to your cart.`);
    });
  });
  
  /* ============================
     Checkout Functionality for Cart Panel
  ============================ */
  // Attach event listener to the Checkout button in the cart panel
  // Replace this problematic line:
document.querySelector('.checkout-btn').addEventListener('click', () => {

  // With this improved version:
  const checkoutButton = document.querySelector('#cartPanel .checkout-btn');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      const cartItemsContainer = document.querySelector('#cartPanel .cart-items');
      if (!cartItemsContainer || cartItemsContainer.children.length === 0) {
        alert("Your cart is empty.");
        return;
      }
      openCartTransactionPopover();
    });
  } else {
    console.error('Checkout button not found in cart panel');
  }

  function openCartTransactionPopover() {
    const cartPanel = document.getElementById('cartPanel');
    let cartTransactionPopover = document.getElementById('cartTransactionPopover');
    if (!cartTransactionPopover) {
      cartTransactionPopover = document.createElement('div');
      cartTransactionPopover.id = 'cartTransactionPopover';
      cartTransactionPopover.classList.add('cart-transaction-popover');
      Object.assign(cartTransactionPopover.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        width: '320px',
        height: '100%',
        backgroundColor: '#fff',
        boxShadow: '-2px 0 5px rgba(0,0,0,0.3)',
        zIndex: '1000',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      });
      // Append to cartPanel if exists; otherwise, fallback to document.body
      (cartPanel || document.body).appendChild(cartTransactionPopover);
    }
    
    // Build inner HTML for the checkout popup
    cartTransactionPopover.innerHTML = `
      <div class="transaction-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ddd;">
        <h2 style="margin: 0;">Checkout</h2>
        <button id="cartTransCloseBtn" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <div class="transaction-content" style="padding: 10px; flex-grow: 1;">
        <!-- Order Type Selection -->
        <div class="order-type" style="display: flex; gap: 10px;">
          <button class="order-type-btn active" data-type="delivery">Delivery</button>
          
        </div>
        <!-- Delivery Address Section -->
        <div id="cartDeliveryInfo" style="display: block; margin-top: 10px;">
          <label for="cartDeliveryAddress" style="font-size: 16px; color: #333;">Delivery Address:</label>
          <input type="text" id="cartDeliveryAddress" placeholder="Enter your delivery address" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">
          <p id="cartAddressErrorMsg" class="error-message" style="display: none; color: red;">Address is required.</p>
        </div>
        <!-- Contact Number Section -->
        <div id="cartContactInfo" style="margin-top: 10px;">
          <label for="cartContactNumber">Contact Number:</label>
          <input type="text" id="cartContactNumber" placeholder="Enter your contact number" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">
          <p id="cartContactErrorMsg" class="error-message" style="display: none; color: red;">Contact number is required.</p>
        </div>
        <!-- Order Items Display -->
        <h3 class="order-title" style="margin-top: 15px;">Your Order</h3>
        <div id="cartOrderItems" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; border-radius: 4px;">
          <!-- Order items will be injected here -->
        </div>
        <!-- Total Amount -->
        <div class="order-total" style="margin-top: 10px; font-weight: bold;">
          <p>Total: ₱<span id="cartOrderTotal">0</span></p>
        </div>
        <!-- Payment Type Selection -->
        <div class="payment-type" style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="payment-type-btn active" data-payment="cash">Cash</button>
          <button class="payment-type-btn" data-payment="gcash">GCash</button>
        </div>
        <div class="payment-content" style="margin-top: 10px;">
          <div class="cash-info" id="cartCashInfo">
            <p>You have selected Cash Payment.</p>
          </div>
          <div class="gcash-info" id="cartGcashInfo" style="display: none;">
            <p>Please scan the QR code to pay via GCash:</p>
            <img src="../images/qr.jpg" alt="GCash QR Code" style="max-width: 100%;">
            <p>Please upload proof of payment:</p>
            <input type="file" id="cartGcashProof" accept="image/*">
            <p id="cartGcashProofError" class="error-message" style="display: none; color: red;">Proof image is required for GCash payment.</p>
            <p>Please enter your GCash reference number:</p>
            <input type="text" id="cartGcashRef" placeholder="Enter GCash Reference Number" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <p id="cartGcashRefError" class="error-message" style="display: none; color: red;">Reference number is required for GCash payment.</p>
          </div>
        </div>
        <!-- Transaction Footer -->
        <div class="transaction-footer" style="display: flex; justify-content: space-between; margin-top: 15px;">
          <button id="cartTransCancelBtn" class="cancel-btn" style="padding: 8px 12px;">Cancel</button>
          <button id="cartTransConfirmBtn" class="confirm-btn" style="padding: 8px 12px;">Confirm Payment</button>
        </div>
      </div>
    `;
    
    // Use local selectors relative to cartTransactionPopover
    const closeBtn = cartTransactionPopover.querySelector('#cartTransCloseBtn');
    const cancelBtn = cartTransactionPopover.querySelector('#cartTransCancelBtn');
    closeBtn.addEventListener('click', closeCartTransactionPopover);
    cancelBtn.addEventListener('click', closeCartTransactionPopover);
    
    // Order Type Toggle
    const orderTypeBtns = cartTransactionPopover.querySelectorAll('.order-type-btn');
    orderTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        orderTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const deliveryInfoDiv = cartTransactionPopover.querySelector('#cartDeliveryInfo');
        deliveryInfoDiv.style.display = btn.getAttribute('data-type') === 'delivery' ? 'block' : 'none';
      });
    });
    
    // Payment Type Toggle
    const paymentTypeBtns = cartTransactionPopover.querySelectorAll('.payment-type-btn');
    paymentTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        paymentTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.getAttribute('data-payment') === 'gcash') {
          cartTransactionPopover.querySelector('#cartGcashInfo').style.display = 'block';
          cartTransactionPopover.querySelector('#cartCashInfo').style.display = 'none';
        } else {
          cartTransactionPopover.querySelector('#cartGcashInfo').style.display = 'none';
          cartTransactionPopover.querySelector('#cartCashInfo').style.display = 'block';
        }
      });
    });
    
    // Populate Order Items and Total (only include checked items)
    const cartItems = document.querySelectorAll('#cartPanel .cart-item');
    const cartOrderItemsDiv = cartTransactionPopover.querySelector('#cartOrderItems');
    cartOrderItemsDiv.innerHTML = '';
    let total = 0;
    cartItems.forEach(item => {
      const checkbox = item.querySelector('.item-select');
      if (checkbox && checkbox.checked) {
        const name = item.getAttribute('data-name');
        const price = parseFloat(item.getAttribute('data-price'));
        const qty = parseInt(item.querySelector('.qty-value').textContent);
        const subtotal = price * qty;
        total += subtotal;
        cartOrderItemsDiv.innerHTML += `<p><strong>${name}:</strong> ${qty} x ₱${price} = ₱${subtotal}</p>`;
      }
    });
    cartTransactionPopover.querySelector('#cartOrderTotal').textContent = total;
    
    
// Attach event listener for Confirm Payment inside the popup
cartTransactionPopover.querySelector('#cartTransConfirmBtn').addEventListener('click', () => {
  // 1) Gather and validate inputs exactly like your home-panel version:
  const orderType = 'delivery'; // or read from your order-type buttons if you add them here
  const deliveryAddress = cartTransactionPopover.querySelector('#cartDeliveryAddress').value.trim();
  const contact  = cartTransactionPopover.querySelector('#cartContactNumber').value.trim();
  const pmBtn    = cartTransactionPopover.querySelector('.payment-type-btn.active');
  const paymentMethod = pmBtn?.getAttribute('data-payment') ?? 'cash';

  if (!deliveryAddress) {
    cartTransactionPopover.querySelector('#cartAddressErrorMsg').style.display = 'block';
    return;
  }
  cartTransactionPopover.querySelector('#cartAddressErrorMsg').style.display = 'none';

  if (!contact || isNaN(contact)) {
    cartTransactionPopover.querySelector('#cartContactErrorMsg').style.display = 'block';
    return;
  }
  cartTransactionPopover.querySelector('#cartContactErrorMsg').style.display = 'none';

  // If GCash, also validate proof/ref…
  if (paymentMethod === 'gcash') {
    const proofInput = cartTransactionPopover.querySelector('#cartGcashProof');
    const refInput   = cartTransactionPopover.querySelector('#cartGcashRef');
    if (!proofInput.files.length) {
      cartTransactionPopover.querySelector('#cartGcashProofError').style.display = 'block';
      return;
    }
    cartTransactionPopover.querySelector('#cartGcashProofError').style.display = 'none';
    if (!refInput.value.trim()) {
      cartTransactionPopover.querySelector('#cartGcashRefError').style.display = 'block';
      return;
    }
    cartTransactionPopover.querySelector('#cartGcashRefError').style.display = 'none';
  }

  // 2) Build FormData exactly like insert_order.php expects:
  const fd = new FormData();
  fd.append('customer', customerName);                      // pulled from global JS var
  fd.append('total', document.querySelector('#cartPanel .total-amount').textContent.replace('₱',''));
  fd.append('contact', contact);
  fd.append('orderType', orderType);
  fd.append('deliveryAddress', deliveryAddress);
  fd.append('payment_method', paymentMethod);

  // Attach proof file if GCash
  if (paymentMethod === 'gcash') {
    fd.append('gcashProof', cartTransactionPopover.querySelector('#cartGcashProof').files[0]);
    fd.append('gcashRef', cartTransactionPopover.querySelector('#cartGcashRef').value.trim());
  }

  // 3) Append the cart items array as JSON:
  const cartItemsData = [];
  document.querySelectorAll('#cartPanel .cart-item').forEach(item => {
    const cb = item.querySelector('.item-select');
    if (cb && cb.checked) {
      cartItemsData.push({
        name:     item.getAttribute('data-name'),
        price:    parseFloat(item.getAttribute('data-price')),
        qty:      parseInt(item.querySelector('.qty-value').textContent, 10)
      });
    }
  });
  fd.append('orderItems', JSON.stringify(cartItemsData));

  // 4) Send it to insert_order.php:
  // In the openCartTransactionPopover function, replace the fetch().then() section:
fetch('insert_order.php', {
  method: 'POST',
  body: fd
})
// Step 1: read raw text
.then(response => response.text())
.then(text => {
  let data;
  try {
    // Step 2: attempt to parse JSON
    data = JSON.parse(text);
  } catch (parseErr) {
    console.error('Invalid JSON from insert_order.php:\n', text);
    alert('Server error occurred. Please check console for details.');
    // rethrow so we land in the catch() below
    throw parseErr;
  }
  return data;
})
// Step 3: your existing success / error logic
.then(data => {
  if (data.status === 'success') {
    const tp = document.querySelector('#cartPanel #transactionPopover');
    if (!tp) {
      console.error('Could not find transactionPopover in #cartPanel');
      return;
    }

    // 1) Fill the popover-info fields:
    tp.querySelector('#popoverCustomerName').textContent    = customerName;
    tp.querySelector('#popoverOrderType').textContent       = 'Delivery';
    tp.querySelector('#popoverPaymentMethod').textContent   = paymentMethod.toUpperCase();
    tp.querySelector('#popoverDeliveryAddress').textContent = deliveryAddress;
    tp.querySelector('#popoverContactNumber').textContent   = contact;
    tp.querySelector('#popoverDateTime').textContent        = new Date().toLocaleString();

    // 2) Populate itemized details:
    const details = tp.querySelector('#popoverOrderDetails');
    details.innerHTML = '';
    cartItemsData.forEach(i => {
      const sub = i.price * i.qty;
      details.innerHTML += `<p><strong>${i.name}:</strong> ${i.qty} x ₱${i.price} = ₱${sub.toFixed(2)}</p>`;
    });

    // 3) Set the total:
    const totalVal = data.total ?? cartItemsData.reduce((sum, i) => sum + i.price * i.qty, 0);
    tp.querySelector('#popoverTotal').textContent = totalVal.toFixed(2);

    // 4) Show the popover and close the checkout popup
    tp.style.display = 'block';
    closeCartTransactionPopover();

  } else {
    alert(`Error placing order: ${data.message}`);
  }
})
// Step 4: catch both network & parse errors
.catch(err => {
  console.error(err);
  // Only alert if not a parse failure (we already alerted there)
  if (!(err instanceof SyntaxError)) {
    alert('There was an error submitting your order.');
  }
  closeCartTransactionPopover();
}); // no change to your `{ once: true }` attach — keep it where you need it


// Add event listener for the popover's cancel button within cart panel
document.querySelector('#cartPanel #popoverCancel')?.addEventListener('click', () => {
  document.querySelector('#cartPanel #transactionPopover').style.display = 'none';
});

// Add event listener for the popover's confirm button
document.querySelector('#cartPanel #popoverConfirm')?.addEventListener('click', () => {
  // Handle final confirmation logic here
  alert('Order confirmed!');
  document.querySelector('#cartPanel #transactionPopover').style.display = 'none';
  // Clear cart or other cleanup logic
});
});
  }
  

  function closeCartTransactionPopover() {
    const cartTransactionPopover = document.getElementById('cartTransactionPopover');
    if (cartTransactionPopover) {
      cartTransactionPopover.remove();
    }
  }
});});
