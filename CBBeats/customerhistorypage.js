document.addEventListener('DOMContentLoaded', function() {
  // -----------------------------
  // Helper to safely obtain order items as an array
  // -----------------------------
  function getOrderItems(order) {
    console.log(`🔍 Checking order items for Order ID: ${order.id}`);
    let items = order.orderItems;
  
    if (!items) {
      console.warn(`⚠️ orderItems is missing or null for Order ID: ${order.id}`);
      return [];
    }
  
    if (typeof items === "string") {
      console.log(`📦 orderItems is a string:`, items);
      try {
        items = JSON.parse(items);
        console.log(`✅ Parsed items:`, items);
      } catch (e) {
        console.error(`❌ Failed to parse orderItems JSON for Order ID: ${order.id}`, e);
        return [];
      }
    }
  
    if (!Array.isArray(items)) {
      console.warn(`⚠️ Parsed orderItems is not an array for Order ID: ${order.id}`, items);
      return [];
    }
  
    console.log(`📋 Final orderItems array for Order ID ${order.id}:`, items);
    return items;
  }
  
  // -----------------------------
  // Show Order Details in History Info Panel
  // -----------------------------
  function showOrderDetails(orderItemElem, orderData) {
    const orderInfoPanel = document.getElementById('historyInfoPanel');
    if (!orderInfoPanel) {
      console.error("History Order Info Panel not found.");
      return;
    }
  
    // Build proof image HTML if available
    let proofHtml = "";
    if (orderData.payment_method && orderData.payment_method.toLowerCase() === "gcash" && orderData.proof) {
      proofHtml = `<p><strong>Payment Proof:</strong><br>
                     <img src="data:image/jpeg;base64,${orderData.proof}" alt="GCash Proof" style="max-width:300px;"> 
                   </p>`;
    }
    
    // Build decline reason HTML if available (for declined orders)
    let declineHtml = "";
    if (orderData.status && orderData.status.toLowerCase() === "declined" && orderData.declineReason) {
      declineHtml = `<p><strong>Decline Reason:</strong> ${orderData.declineReason}</p>`;
    }
  
    // Build delivery address HTML
    const addressHtml = `<p class="delivery-address"><strong>Delivery Address:</strong> ${orderData.delivery_address || 'N/A'}</p>`;
    
    // Handle missing or empty orderItems
    let itemsHTML = "<li>No items found.</li>";
    if (orderData.orderItems && Array.isArray(orderData.orderItems) && orderData.orderItems.length > 0) {
      itemsHTML = orderData.orderItems.map(item => {
        return `<li><strong>${item.name}</strong>: ${item.qty} x ₱${item.price} = ₱${item.qty * item.price}</li>`;
      }).join('');
    } else {
      console.warn(`⚠️ No order items found for Order ID: ${orderData.id}`);
    }
  
    // Compose final details HTML with order-items-list inside a div
    const detailsHTML = `
      <p><strong>Order ID:</strong> ${orderData.id}</p>
      <p><strong>Customer:</strong> ${orderData.customer}</p>
      <p><strong>Total:</strong> ₱${orderData.total}</p>
      <p><strong>Contact:</strong> ${orderData.contact}</p>
      <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
      ${addressHtml}
      ${proofHtml}
      ${declineHtml}
      <p><strong>Order Date:</strong> ${orderData.order_date}</p>
      <div class="order-items-list">
        <ul>
          ${itemsHTML}
        </ul>
      </div>
    `;
    
    // Insert the constructed HTML into historyDetailsText and show the panel
    document.getElementById('historyDetailsText').innerHTML = detailsHTML;
    document.getElementById('historyOrderList').style.display = 'none';
    orderInfoPanel.style.display = 'block';
  }
  
  // -----------------------------
  // Create Order Item HTML (with order-items-list inside order-details)
  // -----------------------------
  function createOrderItem(order, extraButtonsHTML = '') {
    // Safely get order items as an array
    const items = getOrderItems(order);
    let itemsHTML = "";
    if (items.length > 0) {
      items.forEach(item => {
        itemsHTML += `<li><strong>${item.name}</strong>: ${item.qty} x ₱${item.price} = ₱${item.qty * item.price}</li>`;
      });
    } else {
      itemsHTML = `<li>No items found.</li>`;
    }
    // Build the order item structure; order-items-list is inside order-details
    const orderItemHTML = `
      <div class="order-item ripple" 
           data-order-id="${order.id}" 
           data-customer="${order.customer}" 
           data-total="${order.total}" 
           data-contact="${order.contact}" 
           data-payment-method="${order.payment_method}" 
           data-proof="${order.proof}" 
           data-order-date="${order.order_date}" 
           data-delivery-address="${order.delivery_address || ''}"
           data-status="${order.status}"
           ${order.declineReason ? `data-declinereason="${order.declineReason}"` : ''}>
        <div class="order-details">
          <h3>Order #${order.id}</h3>
          <p><strong>Customer:</strong> ${order.customer}</p>
          <p><strong>Total:</strong> ₱${order.total}</p>
          <p><strong>Date:</strong> ${order.order_date}</p>
          <div class="order-items-list">
            <ul>
              ${itemsHTML}
            </ul>
          </div>
        </div>
        <div class="order-actions">
          ${extraButtonsHTML}
        </div>
      </div>
    `;
    return orderItemHTML;
  }
  
  // -----------------------------
  // Load Orders for a Specific Status (for logged-in customer)
  // -----------------------------
  function loadOrdersForStatus(status, targetElementId, extraButtonsGenerator) {
    // Use get_customer_orders.php to filter by the logged-in customer's email.
    fetch(`get_customer_orders.php?status=${encodeURIComponent(status)}`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          const targetList = document.getElementById(targetElementId);
          if (!targetList) return;
          targetList.innerHTML = ''; // Clear previous orders.
          data.orders.forEach(order => {
            let extraButtonsHTML = extraButtonsGenerator ? extraButtonsGenerator(order) : '';
            targetList.insertAdjacentHTML('beforeend', createOrderItem(order, extraButtonsHTML));
            const insertedOrderItem = targetList.lastElementChild;
            // Bind click event to open order details (ignore clicks on order-actions)
            insertedOrderItem.addEventListener('click', function(e) {
              if (e.target.closest('.order-actions')) return;
              const orderData = {
                id: insertedOrderItem.getAttribute('data-order-id'),
                customer: insertedOrderItem.getAttribute('data-customer'),
                total: insertedOrderItem.getAttribute('data-total'),
                contact: insertedOrderItem.getAttribute('data-contact'),
                payment_method: insertedOrderItem.getAttribute('data-payment-method'),
                proof: insertedOrderItem.getAttribute('data-proof'),
                order_date: insertedOrderItem.getAttribute('data-order-date'),
                delivery_address: insertedOrderItem.getAttribute('data-delivery-address'),
                status: insertedOrderItem.getAttribute('data-status'),
                declineReason: insertedOrderItem.getAttribute('data-declinereason') || ''
              };
              showOrderDetails(insertedOrderItem, orderData);
            });
          });
        } else {
          console.error("Error loading orders for status", status, data.message);
        }
      })
      .catch(error => {
        console.error("Fetch error for status", status, error);
      });
  }
  
  // -----------------------------
  // Extra Buttons Generators for Each Section
  // -----------------------------
  // Waiting Section (status "Request"): Add a Cancel button.
  function waitingExtraButtons(order) {
    return `<button class="cancel-order-btn">Cancel</button>`;
  }
  // Ongoing Section (status "Approved"): No extra buttons.
  function ongoingExtraButtons(order) {
    return '';
  }
  // Declined Section (status "Declined"): No extra buttons.
  function declinedExtraButtons(order) {
    return '';
  }
  // Completed Section (status "Completed"): Show a Completed label.
  function completedExtraButtons(order) {
    return `<span class="status-label">Completed</span>`;
  }
  // Cancelled Section (status "Cancelled"): Show a Cancelled label.
  function cancelledExtraButtons(order) {
    return `<span class="status-label">Cancelled</span>`;
  }
  
  // -----------------------------
  // Bind Cancel Button in Waiting Section
  // -----------------------------
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('cancel-order-btn')) {
      e.stopPropagation();
      const orderItem = e.target.closest('.order-item');
      const orderId = orderItem.getAttribute('data-order-id');
      if (confirm("Are you sure you want to cancel this order?")) {
        let formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('newStatus', 'Cancelled');
        fetch('update_order_status.php', { method: 'POST', body: formData })
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success') {
              // Update the order item data-status attribute
              orderItem.setAttribute('data-status', 'Cancelled');
              // Replace the cancel button with a "Cancelled" label
              const actionsDiv = orderItem.querySelector('.order-actions');
              if (actionsDiv) {
                actionsDiv.innerHTML = '<span class="status-label">Cancelled</span>';
              }
              // Optionally, move the order item to the Cancelled section
              const cancelledList = document.getElementById('cancelledList');
              if (cancelledList) {
                // Remove from waiting section and append to cancelled list
                orderItem.remove();
                cancelledList.insertAdjacentElement('beforeend', orderItem);
              }
              showToast("Order cancelled successfully.");
            } else {
              alert(data.message);
            }
          })
          .catch(error => {
            console.error("Error cancelling order:", error);
            alert("Error cancelling order.");
          });
      }
    }
  });
  
  // -----------------------------
  // Load All History Sections for the Logged-In Customer
  // -----------------------------
  function loadCustomerHistoryOrders() {
    loadOrdersForStatus("Request", "waitingList", waitingExtraButtons);    // Waiting orders
    loadOrdersForStatus("Approved", "ongoingList", ongoingExtraButtons);     // Ongoing orders
    loadOrdersForStatus("Declined", "declinedList", declinedExtraButtons);     // Declined orders
    loadOrdersForStatus("Completed", "completedList", completedExtraButtons);  // Completed orders
    loadOrdersForStatus("Cancelled", "cancelledList", cancelledExtraButtons);  // Cancelled orders
  }
  
  // -----------------------------
  // Arrow Scroll Functionality for History Sections
  // -----------------------------
  document.querySelectorAll('.arrow-btn.left').forEach(button => {
    button.addEventListener('click', function() {
      const section = this.closest('.order-section');
      const list = section.querySelector('.order-list');
      list.scrollBy({ left: -200, behavior: 'smooth' });
    });
  });
  
  document.querySelectorAll('.arrow-btn.right').forEach(button => {
    button.addEventListener('click', function() {
      const section = this.closest('.order-section');
      const list = section.querySelector('.order-list');
      list.scrollBy({ left: 200, behavior: 'smooth' });
    });
  });
  
  // -----------------------------
  // "See More" Functionality for History Sections
  // -----------------------------
  document.querySelectorAll('.see-more').forEach(seeMoreBtn => {
    seeMoreBtn.addEventListener('click', function() {
      const section = this.closest('.order-section');
      const isExpanded = section.classList.contains('full-view');
      if (!isExpanded) {
        section.classList.add('full-view');
        this.textContent = 'See less...';
        document.querySelectorAll('.order-section').forEach(s => {
          if (s !== section) s.style.display = 'none';
        });
      } else {
        section.classList.remove('full-view');
        this.textContent = 'See more...';
        document.querySelectorAll('.order-section').forEach(s => s.style.display = 'block');
      }
    });
  });
  
  // -----------------------------
  // History Button: Load History Panel on Click
  // -----------------------------
  const historyButton = document.getElementById('historyButton');
  if (historyButton) {
    historyButton.addEventListener('click', function() {
      document.getElementById('historyContainer').style.display = 'block';
      document.getElementById('homePanel').style.display = 'none';
      document.getElementById('cartPanel').style.display = 'none';
      loadCustomerHistoryOrders();
    });
  }
  
  // -----------------------------
  // Back Button for Order Info Panel in History
  // -----------------------------
  const backToHistoryOrders = document.getElementById('backToHistoryOrders');
  if (backToHistoryOrders) {
    backToHistoryOrders.addEventListener('click', function() {
      document.getElementById('historyInfoPanel').style.display = 'none';
      document.getElementById('historyOrderList').style.display = 'block';
    });
  }
  
  // -----------------------------
  // Customer Feedback: Attach Send Feedback Handler
  // This section assumes that the feedback HTML (textarea, file input, and send button)
  // is part of the history panel (inside the element with id "historyContainer").
  // -----------------------------
  const sendFeedbackButton = document.getElementById('sendFeedback');
  if (sendFeedbackButton) {
    sendFeedbackButton.addEventListener('click', function() {
      const feedbackTextElem = document.getElementById('feedbackText');
      const feedbackText = feedbackTextElem.value.trim();
  
      if (!feedbackText) {
        alert("Please enter your feedback.");
        return;
      }
      
      let formData = new FormData();
      formData.append('feedbackText', feedbackText);
      // Use the globally available customerName passed from PHP
      formData.append('customerName', customerName);
      
      
      
      fetch('submit_feedback.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          alert("Feedback submitted successfully!");
          // Clear input fields after successful submission
          feedbackTextElem.value = '';
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch(error => {
        console.error("Feedback submission error:", error);
        alert("Error submitting feedback.");
      });
    });
  }
});
