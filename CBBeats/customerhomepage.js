// -----------------------------
// Logout Button Functionality
// -----------------------------
const logoutButton = document.getElementById('logoutButton');
logoutButton.addEventListener('click', () => {
  if (confirm("Are you sure you want to logout?")) {
    window.location.href = "adminlogin.php";  // Update if necessary
  }
});

// -----------------------------
// Sidebar Toggle
// -----------------------------
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
toggleSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// -----------------------------
// Ripple Effect for Clickable Elements
// -----------------------------
document.querySelectorAll('.ripple').forEach(el => {
  el.addEventListener('click', function(e) {
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - this.offsetTop - radius}px`;
    circle.classList.add('ripple-effect');
    const existingRipple = this.getElementsByClassName('ripple-effect')[0];
    if (existingRipple) {
      existingRipple.remove();
    }
    this.appendChild(circle);
  });
});

// -----------------------------
// Order Type Toggle (Delivery vs. Take Out)
// -----------------------------
const orderTypeBtns = document.querySelectorAll('.order-type-btn');
orderTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    orderTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const orderType = btn.getAttribute('data-type');
    console.log("Selected order type: " + orderType);
    // Toggle display of delivery address info
    const deliveryInfoDiv = document.getElementById('deliveryInfo');
    if (orderType === 'delivery') {
      deliveryInfoDiv.style.display = 'block';
    } else {
      deliveryInfoDiv.style.display = 'none';
    }
  });
});

// -----------------------------
// Order Summary Logic
// -----------------------------
const orderItemsContainer = document.getElementById('orderItems');
const orderTotalEl = document.getElementById('orderTotal');
let orderTotal = 0;

function updateOrderTotal() {
  let total = 0;
  document.querySelectorAll('.order-item').forEach(item => {
    const unitPrice = parseFloat(item.getAttribute('data-price')) || 0;
    const qtyEl = item.querySelector('.qty-value');
    const qty = parseInt(qtyEl ? qtyEl.textContent : '0', 10) || 0;
    total += unitPrice * qty;
  });
  orderTotal = total;
  if (orderTotalEl) {
    orderTotalEl.textContent = orderTotal;
  }
}

function addOrderItem(name, img, price) {
  // Safeguard: if img is a valid string and does not start with a data URI or external URL, prepend the local images folder.
  if (typeof img === 'string' && img.length > 0 && 
      !img.startsWith("data:") && 
      !img.startsWith("http://") && 
      !img.startsWith("https://")) {
    img = "../images/" + img;
  }
  
  let existingItem = document.querySelector(`.order-item[data-name="${name}"]`);
  if (existingItem) {
    let qtyEl = existingItem.querySelector('.qty-value');
    let qty = parseInt(qtyEl.textContent);
    qtyEl.textContent = qty + 1;
  } else {
    const orderItem = document.createElement('div');
    orderItem.classList.add('order-item');
    orderItem.setAttribute('data-name', name);
    orderItem.setAttribute('data-price', price);
    orderItem.innerHTML = `
      <img src="${img}" alt="${name}">
      <div class="order-details">
        <p class="order-name">${name}</p>
        <p class="order-price">₱${price}</p>
        <div class="quantity-controls">
          <button class="qty-btn minus ripple">-</button>
          <span class="qty-value">1</span>
          <button class="qty-btn plus ripple">+</button>
        </div>
      </div>
      <button class="remove-order-btn ripple" title="Remove Item">×</button>
    `;
    orderItemsContainer.appendChild(orderItem);

    // Attach ripple effect for the new buttons
    orderItem.querySelectorAll('.ripple').forEach(el => {
      el.addEventListener('click', function(e) {
        const circle = document.createElement('span');
        const diameter = Math.max(this.clientWidth, this.clientHeight);
        const radius = diameter / 2;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;
        circle.style.top = `${e.clientY - this.offsetTop - radius}px`;
        circle.classList.add('ripple-effect');
        const existingRipple = this.getElementsByClassName('ripple-effect')[0];
        if (existingRipple) {
          existingRipple.remove();
        }
        this.appendChild(circle);
      });
    });

    // Attach event listener for increasing quantity
    orderItem.querySelector('.plus').addEventListener('click', (e) => {
      e.stopPropagation();
      let qtyEl = orderItem.querySelector('.qty-value');
      let qty = parseInt(qtyEl.textContent);
      qtyEl.textContent = qty + 1;
      updateOrderTotal();
    });
    // Attach event listener for decreasing quantity
    orderItem.querySelector('.minus').addEventListener('click', (e) => {
      e.stopPropagation();
      let qtyEl = orderItem.querySelector('.qty-value');
      let qty = parseInt(qtyEl.textContent);
      if (qty > 1) {
        qtyEl.textContent = qty - 1;
        updateOrderTotal();
      }
    });
    // Attach event listener for the remove button
    orderItem.querySelector('.remove-order-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      orderItem.remove();
      updateOrderTotal();
    });
  }
  updateOrderTotal();
}
// -----------------------------
// Dish Click Event for Add-to-Cart (Handles Static and Dynamic Dishes)
// -----------------------------
document.querySelectorAll('.dish').forEach(dish => {
  dish.addEventListener('click', () => {
    // This will work when the user clicks anywhere on the dish (except on buttons)
    const name = dish.getAttribute('data-name');
    let img = dish.getAttribute('data-img'); // May be null for dynamic dishes
    const price = dish.getAttribute('data-price');
    // If not provided via data-img, try reading the <img> tag's src
    if (!img) {
      const imgTag = dish.querySelector('img');
      if (imgTag) {
        img = imgTag.getAttribute('src');
      }
    }
    addOrderItem(name, img, price);
  });
});


// -----------------------------
// Payment Panel and Transaction Popover Logic
// -----------------------------
(function() {
  const proceedToPaymentBtn = document.getElementById('proceedToPayment');
  const orderView = document.getElementById('orderView');
  const paymentPanel = document.getElementById('paymentPanel');
  const cancelPaymentBtn = document.getElementById('cancelPayment');

  const deliveryAddressInputElem = document.getElementById('deliveryAddress');
  const addressErrorMsg = document.getElementById('addressErrorMsg');

  const gcashProofInput = document.getElementById('gcashProof');
  const gcashProofError = document.getElementById('gcashProofError');
  const confirmPaymentBtn = document.getElementById('confirmPayment');
  const transactionPopover = document.getElementById('transactionPopover');
  const popoverOrderDetails = document.getElementById('popoverOrderDetails');
  const popoverTotal = document.getElementById('popoverTotal');
  const popoverOrderType = document.getElementById('popoverOrderType');
  const popoverPaymentMethod = document.getElementById('popoverPaymentMethod');
  const popoverConfirm = document.getElementById('popoverConfirm');
  const popoverCancel = document.getElementById('popoverCancel');
  const popoverDeliveryAddress = document.getElementById('popoverDeliveryAddress');
  const deliveryAddressInfo = document.getElementById('deliveryAddressInfo');

  deliveryAddressInputElem.addEventListener('input', () => {
    if (deliveryAddressInputElem.value.trim() !== '') {
      deliveryAddressInputElem.classList.remove('input-error');
      addressErrorMsg.style.display = 'none';
    }
  });

  proceedToPaymentBtn.addEventListener('click', (e) => {
    if (!orderItemsContainer || orderItemsContainer.children.length === 0) {
      alert("Please choose at least one dish before proceeding to payment.");
      return;
    }
    
    const contactNumberInput = document.getElementById('contactNumber');
    if (!contactNumberInput.value.trim() || isNaN(contactNumberInput.value.trim())) {
      contactNumberInput.classList.add('input-error');
      document.getElementById('contactErrorMsg').style.display = 'block';
      return;
    }
    
    const activeOrderTypeBtn = document.querySelector('.order-type-btn.active');
    const orderType = activeOrderTypeBtn ? activeOrderTypeBtn.getAttribute('data-type') : 'delivery';
    
    if (orderType === 'delivery') {
      const deliveryAddressValue = deliveryAddressInputElem.value.trim();
      if (!deliveryAddressValue) {
        deliveryAddressInputElem.classList.add('input-error');
        addressErrorMsg.style.display = 'block';
        return;
      }
    }
    
    orderView.style.display = 'none';
    paymentPanel.style.display = 'block';
  });

  cancelPaymentBtn.addEventListener('click', () => {
    paymentPanel.style.display = 'none';
    orderView.style.display = 'block';
  });

  const paymentTypeBtns = document.querySelectorAll('.payment-type-btn');
  paymentTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paymentTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const paymentType = btn.getAttribute('data-payment');
      if (paymentType === 'gcash') {
        document.getElementById('gcashInfo').style.display = 'block';
        document.getElementById('cashInfo').style.display = 'none';
      } else {
        document.getElementById('gcashInfo').style.display = 'none';
        document.getElementById('cashInfo').style.display = 'block';
      }
    });
  });

  confirmPaymentBtn.addEventListener('click', () => {
    console.log('Confirm Payment button clicked.');
    try {
      const activePM = document.querySelector('.payment-type-btn.active');
      const selectedPM = activePM ? activePM.getAttribute('data-payment') : 'cash';
      console.log("Selected payment method:", selectedPM);
      
      if (selectedPM === 'gcash') {
        if (!gcashProofInput || !gcashProofInput.files || gcashProofInput.files.length === 0) {
          gcashProofError.style.display = 'block';
          console.error("Error: GCash proof image is missing.");
          return;
        } else {
          gcashProofError.style.display = 'none';
          const file = gcashProofInput.files[0];
          const imageUrl = URL.createObjectURL(file);
          document.getElementById('proofPreview').src = imageUrl;
          document.getElementById('proofSection').style.display = 'block';
        }
        const gcashRefInput = document.getElementById('gcashRef');
        if (!gcashRefInput.value.trim()) {
          document.getElementById('gcashRefError').style.display = 'block';
          console.error("Error: GCash reference is missing.");
          return;
        } else {
          document.getElementById('gcashRefError').style.display = 'none';
        }
      } else {
        document.getElementById('proofSection').style.display = 'none';
      }
      
      // Build popover content from order items
      popoverOrderDetails.innerHTML = '';
      document.querySelectorAll('.order-item').forEach(item => {
        const qtyEl = item.querySelector('.qty-value');
        const qty = qtyEl ? parseInt(qtyEl.textContent) : 0;
        const name = item.getAttribute('data-name') || 'Unknown';
        const price = parseFloat(item.getAttribute('data-price')) || 0;
        if (qty > 0) {
          const subtotal = qty * price;
          popoverOrderDetails.innerHTML += `<p><strong>${name}:</strong> ${qty} x ₱${price} = ₱${subtotal}</p>`;
        }
      });
      popoverTotal.textContent = orderTotal || 0;
      
      const activeOT = document.querySelector('.order-type-btn.active');
      const orderType = activeOT ? activeOT.getAttribute('data-type') : 'delivery';
      popoverOrderType.textContent = orderType.charAt(0).toUpperCase() + orderType.slice(1);
      popoverPaymentMethod.textContent = selectedPM.toUpperCase();
      
      if (selectedPM === 'gcash') {
        const gcashRef = document.getElementById('gcashRef').value.trim();
        popoverOrderDetails.innerHTML += `<p><strong>GCash Reference:</strong> ${gcashRef}</p>`;
      }
      
      if (orderType === 'delivery') {
        popoverDeliveryAddress.textContent = deliveryAddressInputElem.value;
        deliveryAddressInfo.style.display = 'block';
      } else {
        deliveryAddressInfo.style.display = 'none';
      }
      
      const contactNumberInput = document.getElementById('contactNumber');
      if (contactNumberInput) {
        const contactNumberValue = contactNumberInput.value.trim();
        const popoverContactNumber = document.getElementById('popoverContactNumber');
        if (popoverContactNumber) {
          popoverContactNumber.textContent = contactNumberValue;
        }
      }
      
      const now = new Date();
      const formattedDateTime = now.toLocaleString();
      const popoverDateTime = document.getElementById('popoverDateTime');
      if (popoverDateTime) {
        popoverDateTime.textContent = formattedDateTime;
      }
      
      paymentPanel.style.display = 'none';
      
      // *** FIX: Ensure transaction popover is part of the homePanel ***
      const homePanel = document.getElementById('homePanel');
      if (homePanel && transactionPopover.parentNode !== homePanel) {
        homePanel.appendChild(transactionPopover);
      }
      
      // Now show the transaction popover
      transactionPopover.style.display = 'block';
      transactionPopover.classList.add('active');
      transactionPopover.scrollTop = 0;
      
      console.log('Transaction popover shown successfully.');
      
    } catch (error) {
      console.error("Error in confirmPaymentBtn event listener:", error);
    }
    console.log('Popover state:', transactionPopover.classList.contains('active'));
  });
  
  
  popoverConfirm.addEventListener('click', () => {  
    try {
      let orderItems = [];
      document.querySelectorAll('.order-item').forEach(item => {
        const name = item.getAttribute('data-name');
        const price = parseFloat(item.getAttribute('data-price'));
        const qtyEl = item.querySelector('.qty-value');
        if (!qtyEl) return;
        const qty = parseInt(qtyEl.textContent);
        orderItems.push({ name, price, qty });
      });
      
      if (orderItems.length === 0) {
        alert("confim it!");
        return;
      }
      
      const customer = customerName || "Customer";
      const contact = document.getElementById('contactNumber').value.trim();
      const activeOT = document.querySelector('.order-type-btn.active');
      const orderType = activeOT ? activeOT.getAttribute('data-type') : 'delivery';
      const deliveryAddress = orderType === 'delivery' ? document.getElementById('deliveryAddress').value.trim() : "";
      
      const activePM = document.querySelector('.payment-type-btn.active');
      const selectedPM = activePM ? activePM.getAttribute('data-payment') : 'cash';
      
      let formData = new FormData();
      formData.append('customer', customer);
      formData.append('total', orderTotal);
      formData.append('contact', contact);
      formData.append('payment_method', selectedPM);
      formData.append('deliveryAddress', deliveryAddress);
      formData.append('orderItems', JSON.stringify(orderItems));
      
      if (selectedPM === 'gcash') {
        const gcashProofInput = document.getElementById('gcashProof');
        if (gcashProofInput.files.length > 0) {
          formData.append('gcashProof', gcashProofInput.files[0]);
        }
      }
      
      fetch('insert_order.php', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { 
            throw new Error("Server error: " + text);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'success') {
          console.log('Order submitted successfully:', data.message);
          showToast('Your order has been placed successfully.');
          const newOrder = {
            id: data.order_id,
            customer: customer,
            total: orderTotal,
            contact: document.getElementById('contactNumber').value.trim(),
            payment_method: selectedPM,
            order_date: new Date().toLocaleString()
          };
          localStorage.setItem('newOrder', JSON.stringify(newOrder));
          document.getElementById('orderItems').innerHTML = '';
          orderTotal = 0;
          updateOrderTotal();
        } else {
          console.error('Error submitting order:', data.message);
          showToast('There was an error submitting your order.');
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        showToast('There was an error connecting to the server.');
      });
      
      // FIX: Hide transaction popover properly
      transactionPopover.classList.remove('active');
      transactionPopover.style.display = 'none';
      orderView.style.display = 'block';
      
      document.getElementById('gcashProof').value = ""; 
      document.getElementById('proofPreview').src = "";
      document.getElementById('proofSection').style.display = 'none';
      
    } catch (error) {
      console.error("Error in popoverConfirm event listener:", error);
    }
    console.log('Popover state:', transactionPopover.classList.contains('active'));
  });
  
  popoverCancel.addEventListener('click', () => {
    transactionPopover.classList.remove('active');
    transactionPopover.style.display = 'none';
    paymentPanel.style.display = 'block';
  });
})();

// -----------------------------
// Toast Notification Function
// -----------------------------
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

// -----------------------------
// DOMContentLoaded: Log Customer Name
// -----------------------------
document.addEventListener("DOMContentLoaded", function () {
  const customerNameElement = document.getElementById("customerName");
  if (customerNameElement) {
      console.log("Logged-in customer:", customerNameElement.textContent);
  }
});
// ——————————————
// Live search/filter for customer dishes
// ——————————————
const customerSearch = document.getElementById('searchInput');
customerSearch.addEventListener('input', () => {
  const term = customerSearch.value.trim().toLowerCase();
  const dishGrid = document.querySelectorAll('.dish');
  dishGrid.forEach(dish => {
    const name = dish.getAttribute('data-name')
                  .toLowerCase();
    // show if it includes the search term, otherwise hide
    dish.style.display = name.includes(term) ? 'block' : 'none';
  });

  // optional: scroll grid back to top when search is cleared
  if (!term) {
    const container = document.querySelector('.dish-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
