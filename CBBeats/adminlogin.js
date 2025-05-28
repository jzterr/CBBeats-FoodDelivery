function switchToAdmin() {
    document.getElementById('container').classList.add('admin-active');
}

function switchToCustomer() {
    document.getElementById('container').classList.remove('admin-active');
}

// Unified login function for both admin and customer
async function login(role) {
    const emailField = document.getElementById(role + "-username");
    const passwordField = document.getElementById(role + "-password");
    const email = emailField.value;
    const password = passwordField.value;

    try {
        const response = await fetch("login.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=${role}`
        });

        const textResponse = await response.text();
        try {
            const result = JSON.parse(textResponse);
            
            if (result.status === "success") {
                window.location.href = result.redirectUrl;
            } else {
                // Log debug info if provided
                if (result.debug) {
                    console.log("DEBUG from server:", result.debug);
                }
                
                if (result.message === "There is no existing account.") {
                    alert(result.message);
                } else {
                    let errorElem = document.getElementById(role + "-error");
                    if (!errorElem) {
                        errorElem = document.createElement("p");
                        errorElem.id = role + "-error";
                        errorElem.style.color = "red";
                        errorElem.style.fontSize = "14px";
                        passwordField.parentNode.appendChild(errorElem);
                    }
                    errorElem.textContent = result.message;
                }
            }
        } catch (jsonError) {
            console.error("Invalid JSON response:", textResponse);
            alert("Server returned an unexpected response. Check console for details.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login.");
    }
}


// Toggle password visibility
function togglePassword(inputId, button) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        button.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        button.textContent = "Show";
    }
}
