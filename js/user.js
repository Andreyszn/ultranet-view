// Declare necessary variables and functions
const API_BASE_URL = "http://localhost:8080/user" // API Configuration

let users = []
let userToDelete = null
let currentEditingId = null
let formBackup = {} // Backup form data

// DOM Elements
const userForm = document.getElementById("userForm")
const userTableBody = document.getElementById("userTableBody")
const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")
const clearSearchBtn = document.getElementById("clearSearchBtn")
const loadingOverlay = document.getElementById("loadingOverlay")
const confirmModal = document.getElementById("confirmModal")
const confirmDeleteBtn = document.getElementById("confirmDelete")
const cancelDeleteBtn = document.getElementById("cancelDelete")
const addBtn = document.getElementById("addBtn")
const cancelBtn = document.getElementById("cancelBtn")
const exitBtn = document.getElementById("exitBtn")

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  loadUsers()
  restoreFormData()
})

// Event Listeners
function initializeEventListeners() {
  if (userForm) {
    userForm.addEventListener("submit", handleFormSubmit)
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch)
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", clearSearch)
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch()
      }
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", clearForm)
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDelete)
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeModal)
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", handleExit)
  }

  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        closeModal()
      }
    })
  }

  // Backup form data on input changes
  const userName = document.getElementById("userName")
  const userEmail = document.getElementById("userEmail")
  const userType = document.getElementById("userType")
  const userPassword = document.getElementById("userPassword")

  if (userName) userName.addEventListener("input", backupFormData)
  if (userEmail) userEmail.addEventListener("input", backupFormData)
  if (userType) userType.addEventListener("change", backupFormData)
  if (userPassword) userPassword.addEventListener("input", backupFormData)
}

// Show/Hide loading
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "none"
  }
}

// Show messages
function showMessage(message, type = "success") {
  const existingMessages = document.querySelectorAll(".message")
  existingMessages.forEach((msg) => msg.remove())

  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message

  const mainContent = document.querySelector(".main-content")
  if (mainContent) {
    mainContent.insertBefore(messageDiv, mainContent.firstChild)
  }

  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove()
    }
  }, 5000)
}

// FUNCIÓN API MEJORADA CON MEJOR DEBUGGING
async function apiRequest(url, options = {}) {
  try {
    showLoading()

    console.log("=== API REQUEST DEBUG ===")
    console.log("URL:", url)
    console.log("Method:", options.method || "GET")
    console.log("Headers:", options.headers)
    console.log("Body:", options.body)

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    })

    console.log("=== API RESPONSE DEBUG ===")
    console.log("Status:", response.status)
    console.log("Status Text:", response.statusText)
    console.log("OK:", response.ok)
    console.log("Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`

      try {
        const errorText = await response.text()
        console.log("Error Response Body:", errorText)

        // Intentar parsear como JSON
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.error || errorText
        } catch (jsonError) {
          errorMessage = errorText || errorMessage
        }
      } catch (textError) {
        console.warn("No se pudo leer el error del servidor:", textError)
      }

      throw new Error(errorMessage)
    }

    // Intentar leer la respuesta
    let data = null
    try {
      const responseText = await response.text()
      console.log("Response Body:", responseText)

      if (responseText) {
        try {
          data = JSON.parse(responseText)
        } catch (jsonError) {
          // Si no es JSON válido, devolver el texto
          data = responseText
        }
      }
    } catch (readError) {
      console.warn("No se pudo leer la respuesta:", readError)
      data = null
    }

    console.log("Parsed Data:", data)
    return data
  } catch (error) {
    console.error("=== API ERROR ===")
    console.error("Error:", error)
    console.error("Stack:", error.stack)
    showMessage(`Error: ${error.message}`, "error")
    throw error
  } finally {
    hideLoading()
  }
}

// Load all users
async function loadUsers() {
  try {
    console.log("Cargando usuarios...")
    const data = await apiRequest(API_BASE_URL)
    users = Array.isArray(data) ? data : []
    console.log("Usuarios cargados:", users.length)
    renderUsers(users)
  } catch (error) {
    console.error("Error loading users:", error)
    users = []
    renderUsers([])
  }
}

// Create user
async function createUser(userData) {
  try {
    console.log("Creando usuario:", userData)
    const newUser = await apiRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify(userData),
    })
    console.log("Usuario creado:", newUser)
    showMessage("Usuario creado exitosamente")
    await loadUsers()
    clearForm()
  } catch (error) {
    console.error("Error creating user:", error)
    showMessage("Error al crear el usuario", "error")
  }
}

// FUNCIÓN UPDATE MEJORADA CON MÚLTIPLES MÉTODOS
async function updateUser(id, userData) {
  console.log("=== INICIANDO UPDATE ===")
  console.log("ID a actualizar:", id)
  console.log("Datos a enviar:", userData)
  console.log("URL completa:", `${API_BASE_URL}/${id}`)

  try {
    let success = false
    let lastError = null

    // Método 1: PUT estándar
    try {
      console.log("Intentando método PUT estándar...")
      const updatedUser = await apiRequest(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      })
      console.log("✅ UPDATE exitoso con PUT:", updatedUser)
      success = true
    } catch (error) {
      console.log("❌ Método PUT falló:", error.message)
      lastError = error
    }

    // Método 2: PUT con ID en el body
    if (!success) {
      try {
        console.log("Intentando método PUT con ID en el body...")
        const userDataWithId = { ...userData, id: id }
        const updatedUser = await apiRequest(API_BASE_URL, {
          method: "PUT",
          body: JSON.stringify(userDataWithId),
        })
        console.log("✅ UPDATE exitoso con PUT + ID:", updatedUser)
        success = true
      } catch (error) {
        console.log("❌ Método PUT + ID falló:", error.message)
        lastError = error
      }
    }

    // Método 3: POST con _method=PUT (para servidores que no soportan PUT)
    if (!success) {
      try {
        console.log("Intentando método POST con _method=PUT...")
        const updatedUser = await apiRequest(`${API_BASE_URL}/${id}`, {
          method: "POST",
          body: JSON.stringify({ ...userData, _method: "PUT" }),
        })
        console.log("✅ UPDATE exitoso con POST/_method:", updatedUser)
        success = true
      } catch (error) {
        console.log("❌ Método POST/_method falló:", error.message)
        lastError = error
      }
    }

    // Método 4: PATCH como alternativa
    if (!success) {
      try {
        console.log("Intentando método PATCH...")
        const updatedUser = await apiRequest(`${API_BASE_URL}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(userData),
        })
        console.log("✅ UPDATE exitoso con PATCH:", updatedUser)
        success = true
      } catch (error) {
        console.log("❌ Método PATCH falló:", error.message)
        lastError = error
      }
    }

    if (!success) {
      throw lastError || new Error("Todos los métodos de actualización fallaron")
    }

    console.log("🎉 UPDATE completado exitosamente")
    showMessage("Usuario actualizado exitosamente")
    await loadUsers()
    clearForm()
  } catch (error) {
    console.error("=== ERROR EN UPDATE ===")
    console.error("Error completo:", error)
    showMessage("Error al actualizar el usuario", "error")

    // Información adicional para debugging
    console.log("=== INFORMACIÓN DE DEBUG ===")
    console.log("API_BASE_URL:", API_BASE_URL)
    console.log("ID:", id)
    console.log("UserData:", userData)
    console.log("Current users length:", users.length)
  }
}

// Delete user
async function deleteUser(id) {
  try {
    console.log("Eliminando usuario con ID:", id)
    await apiRequest(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    })
    showMessage("Usuario eliminado exitosamente")
    await loadUsers()
  } catch (error) {
    console.error("Error deleting user:", error)
    showMessage("Error al eliminar el usuario", "error")
  }
}

// Search user by ID
async function searchUserById(id) {
  try {
    console.log("Buscando usuario con ID:", id)
    const user = await apiRequest(`${API_BASE_URL}/${id}`)
    renderUsers([user])
    showMessage(`Usuario encontrado: ${user.name}`)
  } catch (error) {
    console.error("Error searching user:", error)
    renderUsers([])
    showMessage("Usuario no encontrado", "error")
  }
}

// Handle exit
async function handleExit(event) {
  event.preventDefault()
  try {
    showLoading()
    const response = await fetch("http://localhost:8080/user/exit", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      window.location.href = "index.html"
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error("Error during exit:", error)
    showMessage("Error al cerrar sesión", "error")
  } finally {
    hideLoading()
  }
}

// FUNCIÓN FORM SUBMIT MEJORADA
function handleFormSubmit(e) {
  e.preventDefault()

  console.log("=== FORM SUBMIT DEBUG ===")
  console.log("Current editing ID:", currentEditingId)
  console.log("Add button disabled:", addBtn.disabled)

  // Prevenir múltiples submits
  if (addBtn.disabled) {
    console.log("Submit bloqueado - botón deshabilitado")
    return
  }

  const formData = new FormData(userForm)
  const userData = {
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    type: formData.get("type"),
    password: formData.get("password"),
  }

  console.log("Datos del formulario:", userData)

  // Enhanced validation
  const validationErrors = validateForm(userData)
  if (validationErrors.length > 0) {
    showMessage(validationErrors.join(", "), "error")
    return
  }

  // Deshabilitar botón para prevenir doble submit
  addBtn.disabled = true
  const originalText = addBtn.textContent
  addBtn.textContent = "Procesando..."

  if (currentEditingId) {
    console.log("Ejecutando UPDATE para ID:", currentEditingId)
    updateUser(currentEditingId, userData).finally(() => {
      addBtn.disabled = false
      addBtn.textContent = originalText
    })
  } else {
    console.log("Ejecutando CREATE")
    createUser(userData).finally(() => {
      addBtn.disabled = false
      addBtn.textContent = originalText
    })
  }
}

// Clear form
function clearForm() {
  if (userForm) {
    userForm.reset()
  }
  currentEditingId = null
  if (addBtn) {
    addBtn.textContent = "add"
    addBtn.disabled = false
  }
  const existingMessages = document.querySelectorAll(".message")
  existingMessages.forEach((msg) => msg.remove())
  clearFormBackup()
  console.log("Formulario limpiado")
}

// FUNCIÓN EDIT MEJORADA
function editUser(user) {
  console.log("=== EDITANDO USUARIO ===")
  console.log("Usuario a editar:", user)

  document.getElementById("userName").value = user.name || ""
  document.getElementById("userEmail").value = user.email || ""
  document.getElementById("userType").value = user.type || ""
  document.getElementById("userPassword").value = user.password || ""

  currentEditingId = user.id
  console.log("ID de edición establecido:", currentEditingId)

  if (addBtn) {
    addBtn.textContent = "update"
  }

  // Scroll to form
  document.querySelector(".user-options").scrollIntoView({
    behavior: "smooth",
  })

  // Backup form data
  backupFormData()
}

// Delete user with confirmation
function promptDeleteUser(user) {
  userToDelete = user
  confirmModal.style.display = "flex"
}

async function confirmDelete() {
  if (userToDelete) {
    await deleteUser(userToDelete.id)
    userToDelete = null
  }
  closeModal()
}

function closeModal() {
  confirmModal.style.display = "none"
  userToDelete = null
}

// Search functionality
function handleSearch() {
  const searchId = searchInput.value.trim()
  if (!searchId) {
    showMessage("Por favor ingresa un ID para buscar", "error")
    return
  }
  if (isNaN(searchId)) {
    showMessage("El ID debe ser un número", "error")
    return
  }
  searchUserById(Number.parseInt(searchId))
}

function clearSearch() {
  searchInput.value = ""
  renderUsers(users)
}

// Render users in table
function renderUsers(usersToRender) {
  userTableBody.innerHTML = ""

  if (usersToRender.length === 0) {
    const row = userTableBody.insertRow()
    const cell = row.insertCell()
    cell.colSpan = 6
    cell.textContent = "No hay usuarios para mostrar"
    cell.style.textAlign = "center"
    cell.style.padding = "2rem"
    cell.style.opacity = "0.7"
    return
  }

  usersToRender.forEach((user) => {
    const row = userTableBody.insertRow()

    // ID
    const idCell = row.insertCell()
    idCell.textContent = user.id || "N/A"

    // Name
    const nameCell = row.insertCell()
    nameCell.textContent = user.name || "N/A"

    // Email
    const emailCell = row.insertCell()
    emailCell.textContent = user.email || "N/A"

    // Type
    const typeCell = row.insertCell()
    typeCell.textContent = user.type || "N/A"

    // Password (masked)
    const passwordCell = row.insertCell()
    passwordCell.className = "password-cell"
    passwordCell.innerHTML = `
      <div class="password-container">
        <span class="password-text" data-password="${user.password || ""}" data-visible="false">
          ${user.password ? "•".repeat(user.password.length) : "N/A"}
        </span>
        ${
          user.password
            ? `
          <button class="btn-toggle-password" onclick="togglePassword(this)" title="Mostrar/Ocultar contraseña">
            👁️
          </button>
        `
            : ""
        }
      </div>
    `

    // Actions
    const actionsCell = row.insertCell()
    actionsCell.className = "actions-cell"

    // Edit button
    const editBtn = document.createElement("button")
    editBtn.className = "btn btn-edit"
    editBtn.textContent = "edit"
    editBtn.onclick = () => editUser(user)

    // Delete button
    const deleteBtn = document.createElement("button")
    deleteBtn.className = "btn btn-delete"
    deleteBtn.textContent = "delete"
    deleteBtn.onclick = () => promptDeleteUser(user)

    actionsCell.appendChild(editBtn)
    actionsCell.appendChild(deleteBtn)
  })
}

// Utility functions
function validateForm(userData) {
  const errors = []

  if (!userData.name.trim()) {
    errors.push("El nombre es obligatorio")
  }

  if (!userData.email.trim()) {
    errors.push("El email es obligatorio")
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      errors.push("El formato del email no es válido")
    }
  }

  if (!userData.type) {
    errors.push("El tipo de usuario es obligatorio")
  }

  if (!userData.password) {
    errors.push("La contraseña es obligatoria")
  } else if (userData.password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres")
  }

  return errors
}

function backupFormData() {
  if (document.getElementById("userName")) {
    formBackup = {
      name: document.getElementById("userName").value,
      email: document.getElementById("userEmail").value,
      type: document.getElementById("userType").value,
      password: document.getElementById("userPassword").value,
      editingId: currentEditingId,
    }
    console.log("Form data backed up:", formBackup)
  }
}

function restoreFormData() {
  if (formBackup.name || formBackup.email || formBackup.type || formBackup.password) {
    document.getElementById("userName").value = formBackup.name || ""
    document.getElementById("userEmail").value = formBackup.email || ""
    document.getElementById("userType").value = formBackup.type || ""
    document.getElementById("userPassword").value = formBackup.password || ""

    currentEditingId = formBackup.editingId || null

    if (currentEditingId && addBtn) {
      addBtn.textContent = "update"
    }
    console.log("Form data restored:", formBackup)
  }
}

function clearFormBackup() {
  formBackup = {}
}

// Error handling for network issues
window.addEventListener("online", () => {
  showMessage("Conexión restaurada", "success")
})

window.addEventListener("offline", () => {
  showMessage("Sin conexión a internet", "error")
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    if (document.activeElement && document.activeElement.form === userForm) {
      handleFormSubmit(e)
    }
  }

  if (e.key === "Escape") {
    if (confirmModal.style.display === "flex") {
      closeModal()
    } else if (currentEditingId) {
      clearForm()
    }
  }
})

// Toggle password visibility
function togglePassword(button) {
  const passwordText = button.previousElementSibling
  const isVisible = passwordText.getAttribute("data-visible") === "true"
  const actualPassword = passwordText.getAttribute("data-password")

  if (isVisible) {
    passwordText.textContent = "•".repeat(actualPassword.length)
    passwordText.setAttribute("data-visible", "false")
    button.textContent = "👁️"
    button.title = "Mostrar contraseña"
  } else {
    passwordText.textContent = actualPassword
    passwordText.setAttribute("data-visible", "true")
    button.textContent = "🙈"
    button.title = "Ocultar contraseña"
  }
}

function toggleFormPassword() {
  const passwordInput = document.getElementById("userPassword")
  const toggleButton = document.querySelector(".btn-toggle-form-password")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    toggleButton.textContent = "🙈"
    toggleButton.title = "Ocultar contraseña"
  } else {
    passwordInput.type = "password"
    toggleButton.textContent = "👁️"
    toggleButton.title = "Mostrar contraseña"
  }
}

// Función de debug para probar la API
window.debugAPI = async () => {
  console.log("=== DEBUG API ===")
  console.log("URL base:", API_BASE_URL)

  if (users.length > 0) {
    const firstUser = users[0]
    console.log("Primer usuario para prueba:", firstUser)
    console.log("URL de actualización:", `${API_BASE_URL}/${firstUser.id}`)

    // Probar conectividad
    try {
      const response = await fetch(API_BASE_URL)
      console.log("Conectividad OK:", response.ok)
    } catch (error) {
      console.log("Error de conectividad:", error.message)
    }
  }
}

// Make functions available globally
window.togglePassword = togglePassword
window.toggleFormPassword = toggleFormPassword

console.log("User Management System initialized")
console.log("API Base URL:", API_BASE_URL)
console.log("Para debug, ejecuta: debugAPI()")
