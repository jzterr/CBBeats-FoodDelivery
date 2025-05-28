document.addEventListener('DOMContentLoaded', () => {
  /* ============================
     Logout & Sidebar Toggle
  ============================ */
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "adminlogin.php";
    }
  });

  const toggleSidebar = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  /* ============================
     Ripple Effect
  ============================ */
  document.querySelectorAll('.ripple').forEach(element => {
    element.addEventListener('click', function(e) {
      const circle = document.createElement('span');
      const diameter = Math.max(this.clientWidth, this.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;
      circle.style.top = `${e.clientY - this.offsetTop - radius}px`;
      circle.classList.add('ripple-effect');
      const existingRipple = this.querySelector('.ripple-effect');
      if (existingRipple) existingRipple.remove();
      this.appendChild(circle);
    });
  });

  /* ============================
     Panel Visibility Toggles (Home & History)
  ============================ */
  const homeButton = document.getElementById('homeButton');
  const historyButton = document.getElementById('historyButton');

  const homePanel = document.getElementById('homePanel');
  const historyContainer = document.getElementById('historyContainer');
  const historyInfoPanel = document.getElementById('historyInfoPanel');
  // Get ordersContainer if it exists so we can hide it
  const ordersContainer = document.getElementById('ordersContainer');

  function showHomePanel(panel) {
    // Hide all panels
    homePanel.style.display = 'none';
    historyContainer.style.display = 'none';
    historyInfoPanel.style.display = 'none';
    if (ordersContainer) ordersContainer.style.display = 'none';
    // Show the selected panel (for home use, use 'flex'; for history, use 'block')
    panel.style.display = (panel === homePanel) ? 'flex' : 'block';
  }
  homeButton.addEventListener('click', () => showHomePanel(homePanel));
  historyButton.addEventListener('click', () => showHomePanel(historyContainer));

  /* ============================
     History Panel Functionality
  ============================ */
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const historyHeader = item.querySelector('h3').textContent;
      document.getElementById('historyDetailsText').textContent = `Detailed information for ${historyHeader}.`;
      historyContainer.style.display = 'none';
      historyInfoPanel.style.display = 'block';
    });
  });
  document.getElementById('backToHistoryOrders').addEventListener('click', () => {
    historyInfoPanel.style.display = 'none';
    historyContainer.style.display = 'block';
  });

  /* ============================
     Dish Modal Popover (for managing dishes)
  ============================ */
  (function() {
    const dishModal = document.getElementById('dishModal');
    const modalTitle = document.getElementById('modalTitle');
    const dishForm = document.getElementById('dishForm');
    const dishNameInput = document.getElementById('dishName');
    const dishPriceInput = document.getElementById('dishPrice');
    const dishImageInput = document.getElementById('dishImage');
    const cancelDishBtn = document.getElementById('cancelDish');
    const deleteDishBtn = document.getElementById('deleteDish');
    
    let modalMode = 'add'; // 'add' or 'edit'
    let currentDishElement = null;
    
    function applyRippleEffect(element) {
      if (!element.dataset.rippleAttached) {
        element.addEventListener('click', function(e) {
          const circle = document.createElement('span');
          const diameter = Math.max(this.clientWidth, this.clientHeight);
          const radius = diameter / 2;
          circle.style.width = circle.style.height = `${diameter}px`;
          circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;
          circle.style.top = `${e.clientY - this.offsetTop - radius}px`;
          circle.classList.add('ripple-effect');
          const existingRipple = this.querySelector('.ripple-effect');
          if (existingRipple) existingRipple.remove();
          this.appendChild(circle);
        });
        element.dataset.rippleAttached = 'true';
      }
    }
    
    function openDishModal(mode, dishElement) {
      modalMode = mode;
      if (mode === 'add') {
        modalTitle.textContent = 'Add New Dish';
        dishForm.reset();
        currentDishElement = null;
        deleteDishBtn.style.display = 'none';
        // Optionally clear image preview if available.
        const imagePreview = document.getElementById('dishImagePreview');
        if (imagePreview) {
          imagePreview.style.display = 'none';
        }
      } else if (mode === 'edit') {
        modalTitle.textContent = 'Edit Dish';
        currentDishElement = dishElement;
        deleteDishBtn.style.display = 'inline-block';
        const name = dishElement.querySelector('p').textContent;
        const priceText = dishElement.querySelector('span').textContent;
        const price = priceText.replace('₱', '');
        const imgSrc = dishElement.querySelector('img').getAttribute('src');
        // Get the dish id from the data attribute
        const dishId = dishElement.getAttribute('data-id');
        dishNameInput.value = name;
        dishPriceInput.value = price;
        // DO NOT set dishImageInput.value; instead, show a preview
        const imagePreview = document.getElementById('dishImagePreview');
        if (imagePreview) {
          imagePreview.src = imgSrc;
          imagePreview.style.display = 'block';
        }
        // Save the dish id in the modal (for use in update/delete)
        dishForm.setAttribute('data-dish-id', dishId);
      }
      dishModal.style.display = 'flex';
    }
    
    
    
    function closeDishModal() {
      dishModal.style.display = 'none';
    }
    
    const addDishBtn = document.querySelector('.add-dish');
    if (addDishBtn) {
      addDishBtn.addEventListener('click', () => openDishModal('add'));
    } else {
      console.warn("Add Dish button not found!");
    }
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dishElement = btn.closest('.dish');
        if (!dishElement) {
          console.warn("Edit button's dish container not found.");
          return;
        }
        openDishModal('edit', dishElement);
      });
    });
    
    deleteDishBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this dish?')) {
        const dishId = dishForm.getAttribute('data-dish-id');
        if (!dishId) {
          alert("Dish ID not found.");
          return;
        }
        let formData = new FormData();
        formData.append('dishId', dishId);
        fetch('delete_dish.php', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            // Remove the dish element from the dish grid
            currentDishElement.remove();
            closeDishModal();
          } else {
            alert(data.message);
          }
        })
        .catch(err => {
          console.error("Error deleting dish:", err);
          alert("Error deleting dish.");
        });
      }
    });
    
    
    dishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = dishNameInput.value.trim();
      const price = dishPriceInput.value.trim();
      const dishId = dishForm.getAttribute('data-dish-id');
      
      // In add mode, dishId might not be set; handle accordingly
      if (!name || !price) {
        alert('Please fill out all required fields.');
        return;
      }
      
      // Create a FormData object
      let formData = new FormData();
      formData.append('dishName', name);
      formData.append('dishPrice', price);
      
      // If editing, append the dish id
      if (modalMode === 'edit') {
        formData.append('dishId', dishId);
      }
      
      // Check if a new image is selected in the file input.
      if (dishImageInput.files.length > 0) {
        formData.append('dishImage', dishImageInput.files[0]);
      }
      
      // Determine endpoint: add_dish.php for new dish, update_dish.php for edit
      let endpoint = (modalMode === 'add') ? 'add_dish.php' : 'update_dish.php';
      
      fetch(endpoint, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          if (modalMode === 'add') {
            // Create a new dish element dynamically
            const base64Image = data.dish.image; // from add_dish.php response
            const newDish = document.createElement('div');
            newDish.classList.add('dish', 'ripple');
            newDish.setAttribute('data-id', data.dish.id);
            newDish.innerHTML = `
              <img src="data:image/jpeg;base64,${base64Image}" alt="${name}">
              <p>${name}</p>
              <span>₱${price}</span>
              <button class="edit-btn ripple">Edit Dish</button>
            `;
            const dishGrid = document.querySelector('.dish-grid');
            dishGrid.appendChild(newDish);
            // Attach event listener for editing the new dish
            newDish.querySelector('.edit-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              openDishModal('edit', newDish);
            });
          } else if (modalMode === 'edit') {
            // Update the current dish element with new values.
            currentDishElement.querySelector('p').textContent = name;
            currentDishElement.querySelector('span').textContent = `₱${price}`;
            // Update image if new image provided, otherwise keep current image.
            if (data.dish.image) {
              currentDishElement.querySelector('img').src = `data:image/jpeg;base64,${data.dish.image}`;
            }
          }
          closeDishModal();
        } else {
          alert(data.message);
        }
      })
      .catch(err => {
        console.error("Error updating dish:", err);
        alert("Error processing dish update.");
      });
    });
    
    
    
    
    cancelDishBtn.addEventListener('click', () => closeDishModal());
    
    dishModal.addEventListener('click', (e) => {
      if (e.target === dishModal) closeDishModal();
    });
  })();
  
  /* ============================
     Arrow Scroll & "See More" (for Home Panel)
  ============================ */
  document.querySelectorAll('.arrow-btn.left').forEach(button => {
    button.addEventListener('click', function() {
      const container = this.closest('.home-container') || this.closest('.order-section');
      if (container) {
        const list = container.querySelector('.order-list');
        list.scrollBy({ left: -200, behavior: 'smooth' });
      }
    });
  });
  document.querySelectorAll('.arrow-btn.right').forEach(button => {
    button.addEventListener('click', function() {
      const container = this.closest('.home-container') || this.closest('.order-section');
      if (container) {
        const list = container.querySelector('.order-list');
        list.scrollBy({ left: 200, behavior: 'smooth' });
      }
    });
  });
  
  document.querySelectorAll('.see-more').forEach(seeMoreBtn => {
    seeMoreBtn.addEventListener('click', function() {
      const section = this.closest('.order-section');
      const currentlyExpanded = section.classList.contains('full-view');
      if (!currentlyExpanded) {
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
});
document.getElementById('downloadExcel').addEventListener('click', function() {
  // Collect data from dashboard elements
  const data = {
    weeklyRevenue: document.getElementById('weeklyRevenue').textContent.trim(),
    monthlyRevenue: document.getElementById('monthlyRevenue').textContent.trim(),
    annualRevenue: document.getElementById('annualRevenue').textContent.trim(),
    ordersPerDay: document.getElementById('ordersPerDay').textContent.trim(),
    ordersPerWeek: document.getElementById('ordersPerWeek').textContent.trim(),
    ordersPerMonth: document.getElementById('ordersPerMonth').textContent.trim(),
    mostLikelyFoods: Array.from(document.querySelectorAll('#mostLikelyFoods li')).map(li => li.textContent.trim()).join(', ')
  };

  // Create CSV content
  let csvContent = "Metric,Value\n";
  csvContent += `Weekly Revenue,${data.weeklyRevenue}\n`;
  csvContent += `Monthly Revenue,${data.monthlyRevenue}\n`;
  csvContent += `Annual Revenue,${data.annualRevenue}\n`;
  csvContent += `Orders per Day,${data.ordersPerDay}\n`;
  csvContent += `Orders per Week,${data.ordersPerWeek}\n`;
  csvContent += `Orders per Month,${data.ordersPerMonth}\n`;
  csvContent += `Most Likely Foods,${data.mostLikelyFoods}\n`;

  // Create a temporary download link
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "dashboard_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
fetch('get_order_stats.php')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      document.getElementById('weeklyRevenue').textContent = '₱' + data.revenue_stats.weekly_revenue;
      document.getElementById('monthlyRevenue').textContent = '₱' + data.revenue_stats.monthly_revenue;
      document.getElementById('annualRevenue').textContent = '₱' + data.revenue_stats.annual_revenue;
      document.getElementById('ordersPerDay').textContent = data.revenue_stats.orders_today;
      document.getElementById('ordersPerWeek').textContent = data.revenue_stats.orders_this_week;
      document.getElementById('ordersPerMonth').textContent = data.revenue_stats.orders_this_month;
      
      // Populate top foods list
      const topFoodsList = document.getElementById('mostLikelyFoods');
      topFoodsList.innerHTML = '';
      data.top_foods.forEach(food => {
        topFoodsList.insertAdjacentHTML('beforeend', `<li>${food.food} - ${food.total_sold}</li>`);
      });
    } else {
      console.error(data.message);
    }
  })
  .catch(err => console.error("Error fetching order stats:", err));
// ——————————————
// Live search/filter for dishes
// ——————————————
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.dish').forEach(dish => {
    const name = dish.querySelector('p').textContent.toLowerCase();
    // show if matches, hide if not
    dish.style.display = name.includes(term) ? 'block' : 'none';
  });
});
searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  const container = document.getElementById('dishContainer');
  let anyVisible = false;

  document.querySelectorAll('.dish').forEach(dish => {
    const matches = dish.querySelector('p').textContent.toLowerCase().includes(term);
    dish.style.display = matches ? 'block' : 'none';
    if (matches) anyVisible = true;
  });

  // if they cleared the search, scroll to top
  if (!term) container.scrollTo({ top: 0, behavior: 'smooth' });
});
