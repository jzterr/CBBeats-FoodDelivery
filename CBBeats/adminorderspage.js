document.addEventListener('DOMContentLoaded', () => {
  /* ============================
     Orders Panel Toggle
  ============================ */
  const ordersButton = document.getElementById('ordersButton');
  const ordersContainer = document.getElementById('ordersContainer');
  const orderInfoPanel = document.getElementById('orderInfoPanel');
  const homePanel = document.getElementById('homePanel');
  const historyContainer = document.getElementById('historyContainer');
  const backToOrders = document.getElementById('backToOrders');

  if (backToOrders) {
    backToOrders.addEventListener('click', () => {
      orderInfoPanel.style.display = 'none';
      ordersContainer.style.display = 'block';
    });
  } else {
    console.error("Back button not found.");
  }

  ordersButton.addEventListener('click', () => {
    // Hide other panels
    if (homePanel) homePanel.style.display = 'none';
    if (historyContainer) historyContainer.style.display = 'none';
    if (orderInfoPanel) orderInfoPanel.style.display = 'none';
    ordersContainer.style.display = 'block';
    // Clear all sections to avoid duplicate orders
    ['#requestSection', '#approvedSection', '#declinedSection', '#completedSection', '#cancelledSection'].forEach(selector => {
      const sectionList = document.querySelector(selector + " .order-list");
      if (sectionList) sectionList.innerHTML = '';
    });
    // Load orders for each status
    loadOrders("Request", "#requestSection");
    loadOrders("Approved", "#approvedSection");
    loadOrders("Declined", "#declinedSection");
    loadOrders("Completed", "#completedSection");
    loadOrders("Cancelled", "#cancelledSection");
    // Load Customer Feedbacks
    loadFeedback();
  });

  /* ============================
     Function to Load Orders by Status
  ============================ */
  function loadOrders(status, sectionSelector) {
    const sectionList = document.querySelector(sectionSelector + " .order-list");
    if (!sectionList) {
      console.error("Section list element not found for " + sectionSelector);
      return;
    }
    // Clear existing orders in this section
    sectionList.innerHTML = '';

    fetch(`get_orders.php?status=${encodeURIComponent(status)}`)
      .then(response => response.json())
      .then(data => {
        console.log("loadOrders: Received data for status", status, data);
        if (data.status === 'success') {
          data.orders.forEach(order => {
            // Encode order items array (stringify it, then base64 encode)
            const orderItemsEncoded = btoa(JSON.stringify(order.orderItems));

            // Build action buttons based on status
            let actionButtonsHTML = "";
            if (status === "Request") {
              actionButtonsHTML = `
                <div class="action-buttons">
                  <button class="approve-btn">Approve</button>
                  <button class="decline-btn">Decline</button>
                </div>
              `;
            } else if (status === "Approved") {
              actionButtonsHTML = `
                <div class="approved-action-buttons">
                  <button class="cancelled-btn">Cancelled</button>
                  <button class="delivered-btn">Delivered</button>
                </div>
              `;
            } else if (status === "Completed") {
              actionButtonsHTML = `<span class="status-label">Completed</span>`;
            } else if (status === "Declined") {
              actionButtonsHTML = `<span class="status-label">Declined</span>`;
            } else if (status === "Cancelled") {
              actionButtonsHTML = `<span class="status-label">Cancelled</span>`;
            }

            // Build extra info HTML based on order status.
            let extraInfoHTML = "";
            if (order.status === "Declined") {
              extraInfoHTML = `<div class="decline-info">
                <p><strong>Reason:</strong> ${order.declineReason ? order.declineReason : 'N/A'}</p>
                <p><strong>Description:</strong> ${order.declineDescription ? order.declineDescription : 'N/A'}</p>
              </div>`;
            } else if (order.status === "Completed") {
              extraInfoHTML = `<div class="delivered-info">
                <p><strong>Description:</strong> ${order.deliveredDescription ? order.deliveredDescription : 'N/A'}</p>`;
              if (order.deliveredProof) {
                extraInfoHTML += `<img src="data:image/jpeg;base64,${order.deliveredProof}" alt="Delivered Proof" style="max-width:200px;">`;
              }
              extraInfoHTML += `</div>`;
            }

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
                   data-dishes="${orderItemsEncoded}">
                <h3>Order #${order.id}</h3>
                <p>${order.customer}</p>
                <p>Total: ₱${order.total}</p>
                ${actionButtonsHTML}
                ${extraInfoHTML}
              </div>
            `;
            sectionList.insertAdjacentHTML('beforeend', orderItemHTML);
            const insertedOrderItem = sectionList.lastElementChild;

            // Bind click event to open order details
            insertedOrderItem.addEventListener('click', function(e) {
              if (e.target.closest('.action-buttons') ||
                  e.target.closest('.approved-action-buttons') ||
                  e.target.closest('.status-label') ||
                  e.target.closest('.item-status')) return;
              const orderData = {
                id: insertedOrderItem.getAttribute('data-order-id'),
                customer: insertedOrderItem.getAttribute('data-customer'),
                total: insertedOrderItem.getAttribute('data-total'),
                contact: insertedOrderItem.getAttribute('data-contact'),
                payment_method: insertedOrderItem.getAttribute('data-payment-method'),
                proof: insertedOrderItem.getAttribute('data-proof'),
                order_date: insertedOrderItem.getAttribute('data-order-date'),
                delivery_address: insertedOrderItem.getAttribute('data-delivery-address'),
                orderItems: JSON.parse(atob(insertedOrderItem.getAttribute('data-dishes')))
              };
              // Pass extra fields along:
              orderData.status = order.status;
              orderData.declineReason = order.declineReason;
              orderData.declineDescription = order.declineDescription;
              orderData.deliveredProof = order.deliveredProof;
              orderData.deliveredDescription = order.deliveredDescription;
              console.log("Order details:", orderData);
              showOrderDetails(insertedOrderItem, orderData);
            });

            // Bind section-specific order events if needed.
            if (status === "Request") {
              bindRequestOrderEvents(insertedOrderItem);
            }
            if (status === "Approved") {
              bindApprovedOrderEvents(insertedOrderItem);
            }
          });
        } else {
          console.error("Error fetching orders for status:", status, data.message);
        }
      })
      .catch(error => {
        console.error("Fetch error for status:", status, error);
      });
  }
  
  

  /* ============================
     Function to Load Customer Feedbacks
  ============================ */
  function loadFeedback() {
    const feedbackList = document.querySelector('#feedbackSection .order-list');
    if (!feedbackList) {
      console.error("Feedback section list not found.");
      return;
    }
    feedbackList.innerHTML = ''; // Clear any existing feedback items

    fetch('get_feedback.php')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          data.feedbacks.forEach(feedback => {
            let imageHTML = '';
            if (feedback.feedback_image) {
              imageHTML = `<img src="data:image/jpeg;base64,${feedback.feedback_image}" alt="Feedback Image" style="max-width:100px;">`;
            }
            const feedbackHTML = `
              <div class="feedback-item ripple" data-feedback-id="${feedback.id}">
                <h4>${feedback.customer_name}</h4>
                <p>${feedback.feedback_text}</p>
                ${imageHTML}
                <p class="feedback-date">${feedback.created_at}</p>
              </div>
            `;
            feedbackList.insertAdjacentHTML('beforeend', feedbackHTML);
          });
        } else {
          console.error("Error fetching feedback:", data.message);
        }
      })
      .catch(error => {
        console.error("Fetch error for feedback:", error);
      });
  }

  /* ============================
     Order Details Panel for Admin Orders
  ============================ */
  function showOrderDetails(orderItemElem, orderData) {
    if (!orderInfoPanel || !ordersContainer) {
      console.error("Order Info Panel or Orders Container not found.");
      return;
    }
    
    let proofHtml = "";
    if (orderData.payment_method && orderData.payment_method.toLowerCase() === "gcash" && orderData.proof) {
      proofHtml = `<p><strong>Payment Proof:</strong><br>
                     <img src="data:image/jpeg;base64,${orderData.proof}" alt="GCash Proof" style="max-width:300px;">
                   </p>`;
    }
    
    const addressHtml = `<p class="delivery-address"><strong>Delivery Address:</strong> ${orderData.delivery_address || 'N/A'}</p>`;
    
    // Extra details for declined or completed orders.
    let extraDetailsHTML = "";
    if (orderData.status === "Declined") {
      extraDetailsHTML = `<div class="decline-details">
                            <p><strong>Decline Reason:</strong> ${orderData.declineReason ? orderData.declineReason : 'N/A'}</p>
                            <p><strong>Decline Description:</strong> ${orderData.declineDescription ? orderData.declineDescription : 'N/A'}</p>
                          </div>`;
    } else if (orderData.status === "Completed") {
      extraDetailsHTML = `<div class="delivered-details">
                            <p><strong>Delivered Description:</strong> ${orderData.deliveredDescription ? orderData.deliveredDescription : 'N/A'}</p>`;
      if (orderData.deliveredProof) {
        extraDetailsHTML += `<img src="data:image/jpeg;base64,${orderData.deliveredProof}" alt="Delivered Proof" style="max-width:300px;">`;
      }
      extraDetailsHTML += `</div>`;
    }
    
    let itemsHTML = "";
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      if (orderData.orderItems.length > 0) {
        orderData.orderItems.forEach(item => {
          itemsHTML += `<li><strong>${item.name}</strong>: ${item.qty} x ₱${item.price} = ₱${item.qty * item.price}</li>`;
        });
      } else {
        itemsHTML = `<li>No items found.</li>`;
      }
    } else {
      itemsHTML = `<li>No items found.</li>`;
    }
    const itemsSection = `<div class="order-items-info"><h4>Order Items:</h4><ul>${itemsHTML}</ul></div>`;
    
    const detailsHTML = `
      <p><strong>Order ID:</strong> ${orderData.id}</p>
      <p><strong>Customer:</strong> ${orderData.customer}</p>
      <p><strong>Total:</strong> ₱${orderData.total}</p>
      <p><strong>Contact:</strong> ${orderData.contact}</p>
      <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
      ${addressHtml}
      ${proofHtml}
      ${itemsSection}
      ${extraDetailsHTML}
      <p><strong>Order Date:</strong> ${orderData.order_date}</p>
    `;
    document.getElementById('orderDetailsText').innerHTML = detailsHTML;
    ordersContainer.style.display = 'none';
    orderInfoPanel.style.display = 'block';
    const proofImage = document.querySelector('#orderDetailsText img');
    if (proofImage) {
      proofImage.addEventListener('click', () => {
        proofImage.classList.toggle('zoomed');
      });
    }
  }
  
  

  /* ============================
     Request Section: Dynamic Approve/Decline
  ============================ */
  let currentDeclineOrderItem = null;
  let currentDeliveredOrderItem = null;

  function bindRequestOrderEvents(orderItem) {
    const approveBtn = orderItem.querySelector('.approve-btn');
    const declineBtn = orderItem.querySelector('.decline-btn');

    if (approveBtn) {
      approveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm("Are you sure you want to approve this order?")) {
          const orderId = orderItem.getAttribute('data-order-id');
          let formData = new FormData();
          formData.append('orderId', orderId);
          formData.append('newStatus', 'Approved');
          fetch('update_order_status.php', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success') {
              // Move order from Request to Approved section
              const approvedList = document.querySelector('#approvedSection .order-list');
              approvedList.appendChild(orderItem);
              // Remove the Request action buttons and add Approved buttons
              const actionBtns = orderItem.querySelector('.action-buttons');
              if (actionBtns) actionBtns.remove();
              orderItem.insertAdjacentHTML('beforeend', `
                <div class="approved-action-buttons">
                  <button class="cancelled-btn">Cancelled</button>
                  <button class="delivered-btn">Delivered</button>
                </div>
              `);
              bindApprovedOrderEvents(orderItem);
            } else {
              alert(data.message);
            }
          })
          .catch(err => {
            console.error("Error updating order status:", err);
            alert("Error updating order status.");
          });
        }
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentDeclineOrderItem = orderItem;
        document.getElementById('declineModal').style.display = 'flex';
      });
    }
  }

  function bindApprovedOrderEvents(orderItem) {
    const orderId = orderItem.getAttribute('data-order-id');
    const cancelledBtn = orderItem.querySelector('.cancelled-btn');
    const deliveredBtn = orderItem.querySelector('.delivered-btn');

    if (cancelledBtn) {
      cancelledBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to cancel this order?")) {
          let fd = new FormData();
          fd.append('orderId', orderId);
          fd.append('newStatus', 'Cancelled');
          fetch('update_order_status.php', { method: 'POST', body: fd })
            .then(resp => resp.json())
            .then(res => {
              if (res.status === 'success') {
                // Remove approved action buttons before moving the order
                const approvedButtons = orderItem.querySelector('.approved-action-buttons');
                if (approvedButtons) {
                  approvedButtons.remove();
                }
                const cancelledList = document.querySelector('#cancelledSection .order-list');
                cancelledList.appendChild(orderItem);
              } else {
                alert(res.message);
              }
            })
            .catch(err => {
              console.error("Error updating status:", err);
              alert("Error updating order status.");
            });
        }
      });
    }
    if (deliveredBtn) {
      deliveredBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentDeliveredOrderItem = orderItem;
        setDeliveredDatetime();
        document.getElementById('deliveredModal').style.display = 'flex';
      });
    }
  }

  document.getElementById('declineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!confirm("Are you sure you want to decline this order?")) return;
    const reason = document.getElementById('declineReason').value;
    const description = document.getElementById('declineDescription').value;
    if (reason && description && currentDeclineOrderItem) {
      const orderId = currentDeclineOrderItem.getAttribute('data-order-id');
      let formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('newStatus', 'Declined');
      fetch('update_order_status.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
         if(data.status === 'success') {
            const note = `<p style="font-style: italic; color: #555;">
                            <strong>Declined:</strong> ${reason}. ${description}
                          </p>`;
            const actionBtns = currentDeclineOrderItem.querySelector('.action-buttons');
            if (actionBtns) actionBtns.remove();
            document.querySelector('#declinedSection .order-list').appendChild(currentDeclineOrderItem);
            currentDeclineOrderItem.insertAdjacentHTML('beforeend', note);
            document.getElementById('declineModal').style.display = 'none';
            document.getElementById('declineForm').reset();
            currentDeclineOrderItem = null;
         } else {
            alert(data.message);
         }
      })
      .catch(err => {
         console.error("Error updating order status:", err);
         alert("Error updating order status.");
      });
    }
  });

  document.getElementById('cancelDecline').addEventListener('click', () => {
    document.getElementById('declineModal').style.display = 'none';
    document.getElementById('declineForm').reset();
    currentDeclineOrderItem = null;
  });

  // When the Delivered form is submitted, update status to "Completed"
  document.getElementById('deliveredForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!confirm("Are you sure you want to mark this order as delivered?")) return;
    const description = document.getElementById('deliveredDescription').value;
    const proofInput = document.getElementById('deliveredProof');
    if (proofInput.files.length === 0) {
      alert("Please upload a proof image.");
      return;
    }
    const orderId = currentDeliveredOrderItem.getAttribute('data-order-id');
    let formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('newStatus', 'Completed');
    fetch('update_order_status.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
       if(data.status === 'success') {
          const approvedButtons = currentDeliveredOrderItem.querySelector('.approved-action-buttons');
          if (approvedButtons) approvedButtons.remove();
          currentDeliveredOrderItem.insertAdjacentHTML('beforeend', `<span class="status-label">Completed</span>`);
          const completedList = document.querySelector('#completedSection .order-list');
          if (completedList) {
            completedList.appendChild(currentDeliveredOrderItem);
          }
          document.getElementById('deliveredModal').style.display = 'none';
          document.getElementById('deliveredForm').reset();
          orderInfoPanel.style.display = 'none';
          ordersContainer.style.display = 'block';
          currentDeliveredOrderItem = null;
       } else {
          alert(data.message);
       }
    })
    .catch(err => {
       console.error("Error updating order status:", err);
       alert("Error updating order status.");
    });
  });

  document.getElementById('cancelDelivered').addEventListener('click', () => {
    document.getElementById('deliveredModal').style.display = 'none';
    document.getElementById('deliveredForm').reset();
    currentDeliveredOrderItem = null;
  });

  // Global helper for Delivered modal date/time
  function setDeliveredDatetime() {
    const now = new Date();
    const formattedDateTime =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    const dtDisplay = document.getElementById('deliveredDatetimeDisplay');
    if (dtDisplay) {
      dtDisplay.textContent = "Current Date/Time: " + formattedDateTime;
    }
  }

  /* ============================
     Arrow Scroll & "See More" (for Order Sections)
  ============================ */
  document.querySelectorAll('.arrow-btn.left').forEach(button => {
    button.addEventListener('click', function() {
      const container = this.closest('.order-section');
      if (container) {
        const list = container.querySelector('.order-list');
        console.log("Scrolling left in:", container);
        list.scrollBy({ left: -200, behavior: 'smooth' });
      } else {
        console.error("Left arrow button: No closest order-section found.");
      }
    });
  });
  document.querySelectorAll('.arrow-btn.right').forEach(button => {
    button.addEventListener('click', function() {
      const container = this.closest('.order-section');
      if (container) {
        const list = container.querySelector('.order-list');
        console.log("Scrolling right in:", container);
        list.scrollBy({ left: 200, behavior: 'smooth' });
      } else {
        console.error("Right arrow button: No closest order-section found.");
      }
    });
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing see more functionality.");
    
    // Check and log see more buttons on the page.
    const seeMoreButtons = document.querySelectorAll('.see-more');
    console.log("Found", seeMoreButtons.length, "'see more' buttons on the page.");
    if (!seeMoreButtons.length) {
      console.error("No '.see-more' buttons found. Please check your HTML markup.");
    }
    
    seeMoreButtons.forEach(seeMoreBtn => {
      seeMoreBtn.addEventListener('click', function() {
        try {
          console.log("See More button clicked:", this);
          
          // Log the current element's outerHTML to be sure we're seeing the correct button.
          console.log("Button HTML:", this.outerHTML);
          
          // Find the closest .order-section ancestor.
          const section = this.closest('.order-section');
          console.log("Closest .order-section found:", section);
          if (!section) {
            console.error("No .order-section parent found for this button:", this);
            return;
          }
          
          // Log innerHTML of the section to check its structure.
          console.log("Section innerHTML:", section.innerHTML);
          
          const isExpanded = section.classList.contains('full-view');
          console.log("Current expanded state for section:", isExpanded);
          
          if (!isExpanded) {
            section.classList.add('full-view');
            this.textContent = 'See less...';
            console.log("Section expanded, new text set to 'See less...'.");
            // Hide all other order sections for a focused view
            document.querySelectorAll('.order-section').forEach(s => {
              if (s !== section) {
                s.style.display = 'none';
                console.log("Hiding section:", s);
              }
            });
          } else {
            section.classList.remove('full-view');
            this.textContent = 'See more...';
            console.log("Section collapsed, new text set to 'See more...'.");
            // Show all order sections again
            document.querySelectorAll('.order-section').forEach(s => {
              s.style.display = 'block';
              console.log("Showing section:", s);
            });
          }
        } catch (err) {
          console.error("Error in see more toggle handler:", err);
        }
      });
    });
  });
  
  
});
