// Configuración de la API
const API_BASE_URL = "http://localhost:8080/hardwares"

// Variables globales
let hardwareList = []
let currentEditingId = null

// Elementos del DOM
const hardwareForm = document.getElementById("hardwareForm")
const hardwareTableBody = document.getElementById("hardwareTableBody")
const submitBtn = document.getElementById("addBtn")
const cancelBtn = document.getElementById("cancelBtn")
const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")
const clearSearchBtn = document.getElementById("clearSearchBtn")
const loadingOverlay = document.getElementById("loadingOverlay")
const confirmModal = document.getElementById("confirmModal")
const confirmDeleteBtn = document.getElementById("confirmDelete")
const cancelDeleteBtn = document.getElementById("cancelDelete")
const exitBtn = document.getElementById("exitBtn")

// Variables para el modal de confirmación
let hardwareToDelete = null

// Inicializar la aplicación cuando se carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  loadHardware()
  setupEventListeners()
})

// Configurar event listeners
function setupEventListeners() {
  if (hardwareForm) {
    hardwareForm.addEventListener("submit", handleFormSubmit)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelEdit)
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

  if (exitBtn) {
    exitBtn.addEventListener("click", handleExit)
  }

  // Event listeners para el modal de confirmación
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDelete)
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeConfirmModal)
  }

  // Cerrar modal al hacer clic fuera
  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        closeConfirmModal()
      }
    })
  }

  // Cerrar modal con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && confirmModal.style.display === "flex") {
      closeConfirmModal()
    }
  })
}

// Cargar todos los elementos de hardware
async function loadHardware() {
  try {
    showLoading(true)
    console.log("Cargando hardware desde:", API_BASE_URL)

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("Respuesta del servidor:", response.status, response.statusText)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Endpoint no encontrado. Verifica que el servidor esté corriendo.")
      } else if (response.status === 500) {
        throw new Error("Error interno del servidor")
      } else {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }
    }

    const data = await response.json()
    console.log("Datos recibidos:", data)

    if (Array.isArray(data)) {
      hardwareList = data
    } else if (data && Array.isArray(data.data)) {
      hardwareList = data.data
    } else {
      console.warn("Formato de datos inesperado:", data)
      hardwareList = []
    }

    console.log("Hardware cargado:", hardwareList.length, "elementos")
    renderHardwareTable()
  } catch (error) {
    console.error("Error loading hardware:", error)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showMessage("No se puede conectar al servidor. Verifique que esté ejecutándose en localhost:8080", "error")
    } else {
      showMessage(`Error al cargar los componentes de hardware: ${error.message}`, "error")
    }
    hardwareList = []
    renderHardwareTable()
  } finally {
    showLoading(false)
  }
}

// FUNCIÓN PRINCIPAL: Renderizar la tabla de hardware con eventos de acciones
function renderHardwareTable(hardwareToRender = hardwareList) {
  if (!hardwareTableBody) {
    console.error("Elemento hardwareTableBody no encontrado")
    return
  }

  hardwareTableBody.innerHTML = ""

  if (hardwareToRender.length === 0) {
    hardwareTableBody.innerHTML = `
      <tr>
        <td colspan="14" style="text-align: center; padding: 2rem; opacity: 0.7;">
          No hay componentes de hardware registrados
        </td>
      </tr>
    `
    return
  }

  hardwareToRender.forEach((hardware) => {
    const row = document.createElement("tr")

    // Crear las celdas con los datos
    row.innerHTML = `
      <td>${hardware.id || "N/A"}</td>
      <td>${hardware.name || "N/A"}</td>
      <td><span class="type-badge type-${(hardware.type || "").toLowerCase()}">${hardware.type || "N/A"}</span></td>
      <td>${hardware.brand || "N/A"}</td>
      <td class="price-cell">$${formatPrice(hardware.price)}</td>
      <td class="${getQuantityClass(hardware.quantity)}">${hardware.quantity || 0}</td>
      <td>${hardware.power || "N/A"}W</td>
      <td>${hardware.conection || "N/A"}</td>
      <td title="${hardware.description || "N/A"}">${truncateText(hardware.description, 30)}</td>
      <td>${hardware.cpuPort || "----"}</td>
      <td>${hardware.pciePort || "----"}</td>
      <td>${hardware.ramPort || "----"}</td>
      <td>${hardware.storagePort || "----"}</td>
    `

    // Crear la celda de acciones con eventos
    const actionsCell = document.createElement("td")
    actionsCell.className = "actions-cell"

    // Crear botón de editar
    const editBtn = document.createElement("button")
    editBtn.className = "btn btn-edit"
    editBtn.textContent = "editar"
    editBtn.title = `Editar ${hardware.name}`

    // EVENTO DE EDITAR - Asignar directamente
    editBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Editando hardware:", hardware)
      editHardware(hardware)
    })

    // Crear botón de eliminar
    const deleteBtn = document.createElement("button")
    deleteBtn.className = "btn btn-delete"
    deleteBtn.textContent = "eliminar"
    deleteBtn.title = `Eliminar ${hardware.name}`

    // EVENTO DE ELIMINAR - Asignar directamente
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Solicitando eliminación de hardware:", hardware)
      showDeleteConfirmation(hardware)
    })

    // Agregar botones a la celda de acciones
    actionsCell.appendChild(editBtn)
    actionsCell.appendChild(deleteBtn)

    // Agregar la celda de acciones a la fila
    row.appendChild(actionsCell)

    // Agregar la fila a la tabla
    hardwareTableBody.appendChild(row)
  })

  console.log("Tabla renderizada con", hardwareToRender.length, "elementos")
}

// FUNCIÓN DE EDITAR HARDWARE
function editHardware(hardware) {
  console.log("=== EDITANDO HARDWARE ===")
  console.log("Hardware a editar:", hardware)

  // Llenar el formulario con los datos del hardware
  document.getElementById("hardwareName").value = hardware.name || ""
  document.getElementById("hardwareType").value = hardware.type || ""
  document.getElementById("hardwareBrand").value = hardware.brand || ""
  document.getElementById("hardwareQuantity").value = hardware.quantity || 0
  document.getElementById("hardwareConnection").value = hardware.conection || ""
  document.getElementById("hardwarePower").value = hardware.power || 0
  document.getElementById("hardwarePrice").value = hardware.price || 0
  document.getElementById("hardwareDescription").value = hardware.description || ""
  document.getElementById("hardwareCpuPort").value = hardware.cpuPort || ""
  document.getElementById("hardwarePciePort").value = hardware.pciePort || ""
  document.getElementById("hardwareRamPort").value = hardware.ramPort || ""
  document.getElementById("hardwareStoragePort").value = hardware.storagePort || ""

  // Establecer el ID de edición
  currentEditingId = hardware.id
  console.log("ID de edición establecido:", currentEditingId)

  // Cambiar el texto del botón
  if (submitBtn) {
    submitBtn.textContent = "update"
    submitBtn.className = "btn btn-edit"
  }

  // Mostrar botón cancelar
  if (cancelBtn) {
    cancelBtn.style.display = "inline-block"
  }

  // Scroll al formulario
  document.querySelector(".hardware-options").scrollIntoView({
    behavior: "smooth",
  })

  showMessage(`Editando: ${hardware.name}`, "info")
}

// FUNCIÓN PARA MOSTRAR CONFIRMACIÓN DE ELIMINACIÓN
function showDeleteConfirmation(hardware) {
  console.log("Mostrando confirmación para eliminar:", hardware)

  hardwareToDelete = hardware

  // Actualizar el texto del modal con el nombre del hardware
  const modalContent = confirmModal.querySelector(".modal-content")
  if (modalContent) {
    const paragraph = modalContent.querySelector("p")
    if (paragraph) {
      paragraph.innerHTML = `¿Estás seguro de que deseas eliminar el componente <strong>"${hardware.name}"</strong>?<br><small>Esta acción no se puede deshacer.</small>`
    }
  }

  // Mostrar el modal
  confirmModal.style.display = "flex"
}

// FUNCIÓN PARA CONFIRMAR ELIMINACIÓN
async function confirmDelete() {
  if (!hardwareToDelete) {
    console.warn("No hay hardware seleccionado para eliminar")
    return
  }

  console.log("Confirmando eliminación de:", hardwareToDelete)

  try {
    await deleteHardware(hardwareToDelete.id)
    showMessage(`Hardware "${hardwareToDelete.name}" eliminado exitosamente`, "success")
  } catch (error) {
    console.error("Error al eliminar hardware:", error)
    showMessage("Error al eliminar el hardware", "error")
  } finally {
    closeConfirmModal()
  }
}

// FUNCIÓN PARA CERRAR MODAL DE CONFIRMACIÓN
function closeConfirmModal() {
  confirmModal.style.display = "none"
  hardwareToDelete = null
}

// Función de eliminación (DELETE)
async function deleteHardware(id) {
  console.log("Eliminando hardware con ID:", id)

  try {
    showLoading(true)
    console.log("Enviando petición DELETE a:", `${API_BASE_URL}/${id}`)

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("Respuesta del servidor:", response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorText = await response.text()
        console.log("Error del servidor:", errorText)

        if (response.status === 500) {
          errorMessage = "No se puede eliminar este componente porque está siendo usado en el sistema."
        } else if (response.status === 404) {
          errorMessage = "El componente de hardware no fue encontrado."
        } else if (response.status === 403) {
          errorMessage = "No tienes permisos para eliminar este componente."
        } else if (errorText) {
          errorMessage = errorText
        }
      } catch (textError) {
        console.warn("No se pudo leer el texto de error:", textError)
      }

      throw new Error(errorMessage)
    }

    console.log("Hardware eliminado exitosamente")
    await loadHardware() // Recargar la lista completa
  } catch (error) {
    console.error("Error deleting hardware:", error)
    let errorMessage = error.message || "Error al eliminar el componente de hardware"
    if (error.message.includes("Failed to fetch")) {
      errorMessage = "No se puede conectar al servidor. Verifica que esté ejecutándose."
    }
    throw new Error(errorMessage)
  } finally {
    showLoading(false)
  }
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
  searchHardwareById(Number.parseInt(searchId))
}

function clearSearch() {
  if (searchInput) {
    searchInput.value = ""
  }
  renderHardwareTable(hardwareList)
  showMessage("Búsqueda limpiada. Mostrando todos los componentes.", "success")
}

async function searchHardwareById(id) {
  try {
    showLoading(true)
    console.log("Buscando hardware con ID:", id)

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Componente de hardware no encontrado")
      } else {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }
    }

    const hardware = await response.json()
    console.log("Hardware encontrado:", hardware)
    renderHardwareTable([hardware])
    showMessage(`Componente encontrado: ${hardware.name}`, "success")
  } catch (error) {
    console.error("Error searching hardware:", error)
    renderHardwareTable([])
    showMessage(error.message, "error")
  } finally {
    showLoading(false)
  }
}

// Manejar envío del formulario
async function handleFormSubmit(event) {
  event.preventDefault()

  const formData = new FormData(hardwareForm)
  const hardwareData = {
    name: formData.get("name") || "",
    description: formData.get("description") || "",
    type: formData.get("type") || "",
    brand: formData.get("brand") || "",
    conection: formData.get("conection") || "",
    quantity: Number.parseInt(formData.get("quantity")) || 0,
    price: Number.parseFloat(formData.get("price")) || 0,
    power: Number.parseInt(formData.get("power")) || 0,
    cpuPort: formData.get("cpuPort") || "----",
    pciePort: formData.get("pciePort") || "----",
    ramPort: formData.get("ramPort") || "----",
    storagePort: formData.get("storagePort") || "----",
  }

  if (currentEditingId) {
    await updateHardware(currentEditingId, hardwareData)
  } else {
    await createHardware(hardwareData)
  }
}

// Crear nuevo hardware (CREATE)
async function createHardware(hardwareData) {
  try {
    showLoading(true)
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hardwareData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    await loadHardware()
    resetForm()
    showMessage("Componente de hardware creado exitosamente", "success")
  } catch (error) {
    console.error("Error creating hardware:", error)
    showMessage(`Error al crear el componente de hardware: ${error.message}`, "error")
  } finally {
    showLoading(false)
  }
}

// Actualizar hardware
async function updateHardware(id, hardwareData) {
  try {
    showLoading(true)
    hardwareData.id = id
    const response = await fetch(`${API_BASE_URL}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hardwareData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    await loadHardware()
    resetForm()
    showMessage("Componente de hardware actualizado exitosamente", "success")
  } catch (error) {
    console.error("Error updating hardware:", error)
    showMessage(`Error al actualizar el componente de hardware: ${error.message}`, "error")
  } finally {
    showLoading(false)
  }
}

// Cancelar edición
function cancelEdit() {
  resetForm()
}

// Resetear formulario
function resetForm() {
  if (hardwareForm) {
    hardwareForm.reset()
  }
  currentEditingId = null
  if (submitBtn) {
    submitBtn.textContent = "add"
    submitBtn.className = "btn btn-add"
  }
  if (cancelBtn) {
    cancelBtn.style.display = "none"
  }
}

// Mostrar/ocultar loading
function showLoading(show) {
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none"
  }
}

// Mostrar mensajes
function showMessage(message, type = "success") {
  const existingMessage = document.querySelector(".message")
  if (existingMessage) {
    existingMessage.remove()
  }

  const messageElement = document.createElement("div")
  messageElement.className = `message ${type}`
  messageElement.innerHTML = `
    ${message}
    <button type="button" style="float: right; background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;" onclick="this.parentElement.remove()">×</button>
  `

  const mainContent = document.querySelector(".main-content")
  if (mainContent) {
    mainContent.insertBefore(messageElement, mainContent.firstChild)
  }

  setTimeout(() => {
    if (messageElement && messageElement.parentNode) {
      messageElement.remove()
    }
  }, 5000)
}

// Manejar la funcionalidad de salida (exit)
async function handleExit(event) {
  event.preventDefault()
  if (confirm("¿Estás seguro de que quieres salir?")) {
    try {
      showLoading(true)
      const response = await fetch("http://localhost:8080/user/exit", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.text()
      console.log("Logout response:", result)
      showMessage(result, "success")
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1500)
    } catch (error) {
      console.error("Error during exit:", error)
      showMessage("Error al cerrar sesión", "error")
      setTimeout(() => {
        window.location.href = "index.html"
      }, 2000)
    } finally {
      showLoading(false)
    }
  }
}

// Funciones utilitarias
function formatPrice(price) {
  if (!price || isNaN(price)) return "0.00"
  return new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function getQuantityClass(quantity) {
  if (quantity <= 5) return "quantity-low"
  if (quantity <= 15) return "quantity-medium"
  return "quantity-high"
}

function truncateText(text, maxLength) {
  if (!text) return "N/A"
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Console logging for debugging
console.log("Hardware Management System initialized")
console.log("API Base URL:", API_BASE_URL)
