'use client';

/**
 * Gestionar descuentos y campañas (administración financiera).
 * Pantalla centralizada para listar, crear o modificar beneficios/campañas.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Pencil,
  Percent,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import {
  descuentosService,
  type PromocionDescuento,
} from '@/lib/services/descuentos';

export default function DescuentosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [promociones, setPromociones] = useState<PromocionDescuento[]>([]);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<PromocionDescuento>>({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_beneficio: 'PORCENTAJE',
    valor: '',
    alcance: 'GENERAL',
    compatibilidad_seguro: 'CUALQUIERA',
    acumulable: false,
    condiciones_aplicacion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    estado: 'BORRADOR',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await descuentosService.listPromociones();
      setPromociones(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildPayload = (): Partial<PromocionDescuento> => {
    const payload = { ...formData };
    // El backend espera null/ausente, no string vacío en fecha_fin
    if (!payload.fecha_fin) {
      delete payload.fecha_fin;
    }
    return payload;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = buildPayload();
    try {
      if (editingId) {
        await descuentosService.updatePromocion(editingId, payload);
        setSuccess('Campaña actualizada correctamente.');
      } else {
        await descuentosService.createPromocion(payload);
        setSuccess('Campaña creada correctamente.');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error al guardar la campaña');
    }
  };

  const handleEdit = (p: PromocionDescuento) => {
    setEditingId(p.id_promocion);
    setFormData({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      tipo_beneficio: p.tipo_beneficio,
      valor: p.valor,
      alcance: p.alcance,
      compatibilidad_seguro: p.compatibilidad_seguro,
      acumulable: p.acumulable,
      condiciones_aplicacion: p.condiciones_aplicacion,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin || '',
      estado: p.estado,
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({
      codigo: `CAMP-${Math.floor(Math.random()*10000)}`,
      nombre: '',
      descripcion: '',
      tipo_beneficio: 'PORCENTAJE',
      valor: '',
      alcance: 'GENERAL',
      compatibilidad_seguro: 'CUALQUIERA',
      acumulable: false,
      condiciones_aplicacion: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      estado: 'BORRADOR',
    });
    setShowModal(true);
  };

  const filtered = promociones.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            Descuentos y Campañas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Administración de beneficios aplicables a pacientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title="Recargar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Campaña
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <label className="sr-only">Buscar</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Cargando información...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Tag className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No se encontraron campañas</p>
            <p>Intenta ajustar la búsqueda o crea una nueva.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código / Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={item.id_promocion} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                      <div className="text-sm text-gray-500 font-mono">{item.codigo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold flex items-center gap-1">
                        {item.tipo_beneficio === 'PORCENTAJE' ? <Percent className="w-3 h-3 text-blue-500"/> : '$'}
                        {item.valor}
                      </div>
                      <div className="text-xs text-gray-500">{item.alcance}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.fecha_inicio} al {item.fecha_fin || 'Indefinido'}
                      </div>
                      {item.vigente_hoy && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Vigente hoy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.estado === 'ACTIVA' ? 'bg-green-100 text-green-800' : 
                          item.estado === 'BORRADOR' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mx-2"
                        title="Modificar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-5 border-b pb-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {editingId ? 'Editar Campaña' : 'Registrar Nueva Campaña'}
                    </h3>
                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 relative z-10 w-8 h-8 flex items-center justify-center">
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Código</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-gray-600"
                        value={formData.codigo}
                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                        disabled={!!editingId}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.estado}
                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="BORRADOR">Borrador</option>
                        <option value="ACTIVA">Activa</option>
                        <option value="INACTIVA">Inactiva</option>
                        <option value="FINALIZADA">Finalizada</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Nombre de la Campaña</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Descripción</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.descripcion}
                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Tipo de Beneficio</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.tipo_beneficio}
                        onChange={e => setFormData({ ...formData, tipo_beneficio: e.target.value as 'PORCENTAJE' | 'MONTO_FIJO' })}
                      >
                        <option value="PORCENTAJE">Porcentaje (%)</option>
                        <option value="MONTO_FIJO">Monto Fijo ($)</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.valor}
                        onChange={e => setFormData({ ...formData, valor: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.fecha_inicio}
                        onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                      <input
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.fecha_fin || ''}
                        onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Alcance</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.alcance}
                        onChange={e => setFormData({ ...formData, alcance: e.target.value as 'GENERAL' | 'ASIGNADA' })}
                      >
                        <option value="GENERAL">Todos los Pacientes</option>
                        <option value="ASIGNADA">Solo Asignados</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Compatibilidad Seguro</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.compatibilidad_seguro}
                        onChange={e => setFormData({ ...formData, compatibilidad_seguro: e.target.value })}
                      >
                        <option value="CUALQUIERA">Cualquiera (Compatible)</option>
                        <option value="SOLO_SIN_SEGURO">Solo sin Aseguradora</option>
                        <option value="INCOMPATIBLE_SEGURO">No acumular con Seguros</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={formData.acumulable}
                          onChange={e => setFormData({ ...formData, acumulable: e.target.checked })}
                        />
                        ¿Es Acumulable con otras campañas del paciente?
                      </label>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Condiciones (Términos e info interna)</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.condiciones_aplicacion}
                        onChange={e => setFormData({ ...formData, condiciones_aplicacion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    {editingId ? 'Guardar Cambios' : 'Registrar Campaña'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}