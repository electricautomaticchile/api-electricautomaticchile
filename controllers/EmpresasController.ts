import { Request, Response } from 'express';
import { IEmpresa, ICrearEmpresa, IActualizarEmpresa } from '../models/Empresa';

// Simulamos una base de datos en memoria
let empresas: IEmpresa[] = [
  {
    id: 1,
    nombre: 'TechCorp Ltda.',
    razonSocial: 'TechCorp Limitada',
    rut: '76.123.456-7',
    email: 'contacto@techcorp.cl',
    telefono: '+56223456789',
    direccion: 'Av. Las Condes 1234',
    ciudad: 'Santiago',
    region: 'Metropolitana',
    pais: 'Chile',
    sitioWeb: 'https://techcorp.cl',
    giro: 'Servicios de tecnología',
    tipoEmpresa: 'cliente',
    estado: 'activa',
    contactoPrincipal: {
      nombre: 'María González',
      email: 'maria.gonzalez@techcorp.cl',
      telefono: '+56987654321',
      cargo: 'Gerente de Operaciones'
    },
    configuraciones: {
      limiteCotizaciones: 50,
      descuentoEspecial: 10,
      plazoCredito: 30,
      requiereAprobacion: false
    },
    fechaRegistro: new Date(),
    activo: true,
    fechaCreacion: new Date()
  }
];

let nextId = 2;

export class EmpresasController {
  // GET /api/empresas
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const { tipoEmpresa, estado, ciudad, region, limite, pagina } = req.query;
      
      let empresasFiltradas = empresas.filter(e => e.activo);

      // Filtros
      if (tipoEmpresa) {
        empresasFiltradas = empresasFiltradas.filter(e => e.tipoEmpresa === tipoEmpresa);
      }
      if (estado) {
        empresasFiltradas = empresasFiltradas.filter(e => e.estado === estado);
      }
      if (ciudad) {
        empresasFiltradas = empresasFiltradas.filter(e => 
          e.ciudad.toLowerCase().includes((ciudad as string).toLowerCase())
        );
      }
      if (region) {
        empresasFiltradas = empresasFiltradas.filter(e => 
          e.region.toLowerCase().includes((region as string).toLowerCase())
        );
      }

      // Ordenar por nombre
      empresasFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const empresasPaginadas = empresasFiltradas.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: empresasPaginadas,
        meta: {
          total: empresasFiltradas.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(empresasFiltradas.length / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener empresas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/empresas/:id
  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const empresa = empresas.find(e => e.id === id && e.activo);
      
      if (!empresa) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: empresa
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener empresa',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/empresas/buscar/:termino
  buscar = (req: Request, res: Response): void => {
    try {
      const termino = req.params.termino.toLowerCase();
      const { limite } = req.query;
      
      const empresasEncontradas = empresas.filter(e => 
        e.activo && (
          e.nombre.toLowerCase().includes(termino) ||
          e.razonSocial.toLowerCase().includes(termino) ||
          e.rut.includes(termino) ||
          e.email.toLowerCase().includes(termino)
        )
      );

      // Limitar resultados
      const limitNum = limite ? Number(limite) : 10;
      const resultados = empresasEncontradas.slice(0, limitNum);

      res.status(200).json({
        success: true,
        data: resultados,
        total: empresasEncontradas.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al buscar empresas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/empresas
  crear = (req: Request, res: Response): void => {
    try {
      const datosEmpresa: ICrearEmpresa = req.body;
      
      // Validaciones básicas
      if (!datosEmpresa.nombre || !datosEmpresa.razonSocial || !datosEmpresa.rut || !datosEmpresa.email) {
        res.status(400).json({
          success: false,
          message: 'Nombre, razón social, RUT y email son requeridos'
        });
        return;
      }

      // Verificar RUT único
      const rutExiste = empresas.some(e => e.rut === datosEmpresa.rut && e.activo);
      if (rutExiste) {
        res.status(400).json({
          success: false,
          message: 'El RUT ya está registrado'
        });
        return;
      }

      // Verificar email único
      const emailExiste = empresas.some(e => e.email === datosEmpresa.email && e.activo);
      if (emailExiste) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      const nuevaEmpresa: IEmpresa = {
        id: nextId++,
        ...datosEmpresa,
        pais: datosEmpresa.pais || 'Chile',
        tipoEmpresa: datosEmpresa.tipoEmpresa || 'cliente',
        estado: 'activa',
        fechaRegistro: new Date(),
        activo: true,
        fechaCreacion: new Date()
      };

      empresas.push(nuevaEmpresa);

      res.status(201).json({
        success: true,
        message: 'Empresa creada exitosamente',
        data: nuevaEmpresa
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear empresa',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/empresas/:id
  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarEmpresa = req.body;
      
      const empresaIndex = empresas.findIndex(e => e.id === id);
      if (empresaIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
        return;
      }

      // Verificar RUT único si se está actualizando
      if (datosActualizacion.rut) {
        const rutExiste = empresas.some(e => e.rut === datosActualizacion.rut && e.id !== id && e.activo);
        if (rutExiste) {
          res.status(400).json({
            success: false,
            message: 'El RUT ya está registrado'
          });
          return;
        }
      }

      // Verificar email único si se está actualizando
      if (datosActualizacion.email) {
        const emailExiste = empresas.some(e => e.email === datosActualizacion.email && e.id !== id && e.activo);
        if (emailExiste) {
          res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
          });
          return;
        }
      }

      empresas[empresaIndex] = {
        ...empresas[empresaIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Empresa actualizada exitosamente',
        data: empresas[empresaIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar empresa',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/empresas/:id/estado
  cambiarEstado = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { estado } = req.body;
      
      if (!['activa', 'inactiva', 'suspendida'].includes(estado)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: activa, inactiva o suspendida'
        });
        return;
      }

      const empresaIndex = empresas.findIndex(e => e.id === id);
      if (empresaIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
        return;
      }

      empresas[empresaIndex].estado = estado;
      empresas[empresaIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: `Empresa ${estado} exitosamente`,
        data: empresas[empresaIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de empresa',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // DELETE /api/empresas/:id
  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const empresaIndex = empresas.findIndex(e => e.id === id);
      
      if (empresaIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
        return;
      }

      // Soft delete
      empresas[empresaIndex].activo = false;
      empresas[empresaIndex].estado = 'inactiva';
      empresas[empresaIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Empresa eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar empresa',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/empresas/estadisticas
  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      const totalEmpresas = empresas.filter(e => e.activo).length;
      
      const estadisticasPorTipo = {
        cliente: empresas.filter(e => e.tipoEmpresa === 'cliente' && e.activo).length,
        proveedor: empresas.filter(e => e.tipoEmpresa === 'proveedor' && e.activo).length,
        socio: empresas.filter(e => e.tipoEmpresa === 'socio' && e.activo).length
      };

      const estadisticasPorEstado = {
        activa: empresas.filter(e => e.estado === 'activa' && e.activo).length,
        inactiva: empresas.filter(e => e.estado === 'inactiva' && e.activo).length,
        suspendida: empresas.filter(e => e.estado === 'suspendida' && e.activo).length
      };

      const estadisticasPorRegion = empresas
        .filter(e => e.activo)
        .reduce((acc, empresa) => {
          acc[empresa.region] = (acc[empresa.region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const empresasRecientes = empresas
        .filter(e => e.activo)
        .sort((a, b) => b.fechaRegistro.getTime() - a.fechaRegistro.getTime())
        .slice(0, 5);

      res.status(200).json({
        success: true,
        data: {
          total: totalEmpresas,
          porTipo: estadisticasPorTipo,
          porEstado: estadisticasPorEstado,
          porRegion: estadisticasPorRegion,
          recientes: empresasRecientes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de empresas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 