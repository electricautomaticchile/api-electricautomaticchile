import { Router } from 'express';
import { CotizacionesController } from '../controllers/CotizacionesController';

const router = Router();
const cotizacionesController = new CotizacionesController();

// =================== FLUJO FORMULARIO DE CONTACTO ===================

/**
 * @route   POST /api/cotizaciones/contacto
 * @desc    Recibir formulario de contacto desde frontend
 * @access  Public (para que el frontend pueda enviar sin autenticación)
 * @body    { nombre, email, empresa?, telefono?, servicio, plazo?, mensaje, archivoUrl?, archivo?, archivoTipo? }
 */
router.post('/contacto', cotizacionesController.recibirFormularioContacto);

// =================== GESTIÓN DE COTIZACIONES ===================

/**
 * @route   GET /api/cotizaciones
 * @desc    Obtener todas las cotizaciones con filtros y paginación
 * @access  Private (requiere autenticación)
 * @query   ?page=1&limit=10&estado=pendiente&prioridad=alta&servicio=cotizacion_completa
 */
router.get('/', cotizacionesController.obtenerTodos);

/**
 * @route   GET /api/cotizaciones/pendientes
 * @desc    Obtener cotizaciones pendientes de revisión
 * @access  Private
 */
router.get('/pendientes', cotizacionesController.obtenerPendientes);

/**
 * @route   GET /api/cotizaciones/estadisticas
 * @desc    Obtener estadísticas del dashboard de cotizaciones
 * @access  Private
 */
router.get('/estadisticas', cotizacionesController.obtenerEstadisticas);

/**
 * @route   GET /api/cotizaciones/:id
 * @desc    Obtener cotización específica por ID
 * @access  Private
 * @params  id - ObjectId de la cotización
 */
router.get('/:id', cotizacionesController.obtenerPorId);

/**
 * @route   POST /api/cotizaciones
 * @desc    Crear cotización manual (opcional)
 * @access  Private
 * @body    { nombre, email, empresa?, telefono?, servicio, plazo?, mensaje }
 */
router.post('/', cotizacionesController.crear);

/**
 * @route   PUT /api/cotizaciones/:id/estado
 * @desc    Cambiar estado de una cotización
 * @access  Private
 * @params  id - ObjectId de la cotización
 * @body    { estado: 'pendiente'|'en_revision'|'cotizando'|'cotizada'|'aprobada'|'rechazada'|'convertida_cliente', notas?: string }
 */
router.put('/:id/estado', cotizacionesController.cambiarEstado);

/**
 * @route   PUT /api/cotizaciones/:id/cotizar
 * @desc    Agregar datos de cotización (precio, items, etc.)
 * @access  Private
 * @params  id - ObjectId de la cotización
 * @body    { titulo, descripcion?, items: [{ descripcion, cantidad, precioUnitario, subtotal }], subtotal, iva, total, validezDias?, condicionesPago? }
 */
router.put('/:id/cotizar', cotizacionesController.agregarCotizacion);

// =================== CONVERSIÓN A CLIENTE ===================

/**
 * @route   POST /api/cotizaciones/:id/convertir-cliente
 * @desc    Convertir cotización aprobada a cliente y enviar credenciales
 * @access  Private
 * @params  id - ObjectId de la cotización
 * @body    { passwordTemporal?: string, planSeleccionado?: 'basico'|'premium'|'enterprise', montoMensual?: number }
 */
router.post('/:id/convertir-cliente', cotizacionesController.convertirACliente);

/**
 * @route   DELETE /api/cotizaciones/:id
 * @desc    Eliminar cotización
 * @access  Private
 * @params  id - ObjectId de la cotización
 */
router.delete('/:id', cotizacionesController.eliminar);

export default router; 