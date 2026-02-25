

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SiteSettings, Product, Order, User, Course, CourseCreationData, CourseAccessRequest, Ticket, Omit } from '../types';
import {
    saveSiteSettings as apiSaveSiteSettings,
    fetchAdminSiteSettings,
    fetchProducts as apiFetchProducts,
    addProduct as apiAddProduct,
    updateProduct as apiUpdateProduct,
    deleteProduct as apiDeleteProduct,
    addMultipleProducts as apiAddMultipleProducts,
    deleteMultipleProducts as apiDeleteMultipleProducts,
    fetchCourses as apiFetchCourses,
    addCourse as apiAddCourse,
    updateCourse as apiUpdateCourse,
    deleteCourse as apiDeleteCourse,
    addMultipleCourses as apiAddMultipleCourses,
    deleteMultipleCourses as apiDeleteMultipleCourses,
    fetchOrders as apiFetchAdminOrders,
    fetchMyOrders,
    fetchMyProfile,
    updateMyProfile,
    updateOrderTracking,
    fetchAccessRequests as apiFetchAccessRequests,
    approveAccessRequest as apiApproveAccessRequest,
    cancelMyOrder,
    fetchTickets as apiFetchTickets,
    updateTicketStatus as apiUpdateTicketStatus,
    deleteTicket as apiDeleteTicket,
    resendVerificationEmail,
} from '../services/api';
import { useSiteSettings as useSiteSettingsContextHook } from '../hooks/useSiteSettings';
import { useToast } from '../contexts/ToastContext';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import ProductEditModal from '../components/ProductEditModal';
import CourseEditModal from '../components/CourseEditModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { XMarkIcon } from '@heroicons/react/24/solid';
import ImageUploadField from '../components/ImageUploadField';


// Icon Imports
import UserCircleIcon from '../components/icons/UserCircleIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import CogIcon from '../components/icons/CogIcon';
import DocumentArrowUpIcon from '../components/icons/DocumentArrowUpIcon';
import DocumentArrowDownIcon from '../components/icons/DocumentArrowDownIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import KeyIcon from '../components/icons/KeyIcon';
import ArrowPathIcon from '../components/icons/ArrowPathIcon';
import PhotoIcon from '../components/icons/PhotoIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import ClockIcon from '../components/icons/ClockIcon';
import LinkIcon from '../components/icons/LinkIcon';
import TicketIcon from '../components/icons/TicketIcon';
import ExclamationTriangleIcon from '../components/icons/ExclamationTriangleIcon';
import EnvelopeIcon from '../components/icons/EnvelopeIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ServerIcon from '../components/icons/ServerIcon';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';

type ActiveTabType = 'profile' | 'orders' | 'adminProducts' | 'adminSite' | 'adminOrders' | 'adminCourses' | 'adminCourseAccess' | 'adminTickets';
type SortKey = 'name' | 'category' | 'price' | 'createdAt' | 'title' | 'level' | 'customerName' | 'status' | 'totalAmount' | 'email';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const InputField = ({ label, name, icon: Icon, isTextarea = false, ...props }: any) => {
  const commonClasses = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm bg-gray-50 text-text-body focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1 flex items-center";

  return (
    <div>
      <label htmlFor={name} className={labelClasses}>
        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
        {label}
      </label>
      {isTextarea ? (
        <textarea name={name} id={name} rows={3} className={commonClasses} {...props} />
      ) : (
        <input type={props.type || 'text'} name={name} id={name} className={commonClasses} {...props} />
      )}
    </div>
  );
};

// --- Shipping Document Modal ---
const ShippingDocumentModal: React.FC<{ order: Order; siteSettings: SiteSettings | null; onClose: () => void; }> = ({ order, siteSettings, onClose }) => {
    const printContentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printContentRef.current?.innerHTML;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Documento de Envio - Pedido #${order.id.substring(0, 8)}</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 2rem; color: #333; }
                            h2, h3 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px; }
                            p, li { line-height: 1.6; }
                            .section { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
                            .signature-line { margin-top: 4rem; padding-top: 1rem; border-top: 1px solid #ccc; }
                            ul { padding-left: 20px; }
                            strong { font-weight: 600; }
                        </style>
                    </head>
                    <body>${content}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-semibold text-gray-800 m-0 p-0 border-none">Documento de Envio - Pedido #{order.id.substring(0, 8)}</h2>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="primary" size="sm">Imprimir</Button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto text-sm" ref={printContentRef}>
                    <div className="section">
                        <h3>Remetente</h3>
                        <p><strong>{siteSettings?.siteName}</strong></p>
                        <p>{siteSettings?.storeAddress}</p>
                        <p>Telefone: {siteSettings?.contactPhone}</p>
                        {siteSettings?.contactEmail && <p>Email: {siteSettings.contactEmail}</p>}
                    </div>
                    <div className="section">
                        <h3>Destinatário</h3>
                        <p><strong>{order.customerName}</strong></p>
                        <p>{order.shippingAddress}</p>
                        <p>{order.shippingCity}, {order.shippingState} - CEP: {order.shippingPostalCode}</p>
                        {order.user?.phone && <p>Telefone: {order.user.phone}</p>}
                    </div>
                    <div className="section">
                        <h3>Detalhes do Envio</h3>
                        <p><strong>Item(ns) Enviado(s):</strong></p>
                        <ul>
                            {order.items.map(item => (
                                <li key={item.id}>- {item.product?.name || item.course?.title} (x{item.quantity})</li>
                            ))}
                        </ul>
                        <p><strong>Quantidade Total:</strong> {totalQuantity}</p>
                        <p><strong>Data do Envio:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Forma de Envio/Transportadora:</strong> Correios / Transportadora</p>
                        <p><strong>Código de Rastreamento:</strong> {order.trackingCode || 'N/A'}</p>
                    </div>
                    <div className="section">
                        <h3>Observações:</h3>
                        <div style={{ height: '4rem' }}></div>
                    </div>
                    <div className="signature-line">
                        <p style={{ marginBottom: '2rem' }}>_________________________________________</p>
                        <p>Assinatura do Responsável</p>
                        <p>{siteSettings?.siteName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SettingsPage: React.FC = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { settings: contextSiteSettings, refetchSiteSettings } = useSiteSettingsContextHook();
    const { addToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<ActiveTabType>('profile');
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: async () => {} });
    
    // Admin Products States
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSortConfig, setProductSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const productFileInputRef = useRef<HTMLInputElement>(null);
    const [productUploadStatus, setProductUploadStatus] = useState<{message: string; type: 'success' | 'error'} | null>(null);
    const [isUploadingProducts, setIsUploadingProducts] = useState(false);

    // Admin Courses States
    const [courses, setCourses] = useState<Course[]>([]);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isCourseEditModalOpen, setIsCourseEditModalOpen] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [courseSortConfig, setCourseSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const courseFileInputRef = useRef<HTMLInputElement>(null);
    const [courseUploadStatus, setCourseUploadStatus] = useState<{message: string; type: 'success' | 'error'} | null>(null);
    const [isUploadingCourses, setIsUploadingCourses] = useState(false);
    const [accessRequests, setAccessRequests] = useState<CourseAccessRequest[]>([]);
    
    // User Profile & Orders States
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [orderSortConfig, setOrderSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const [trackingCodes, setTrackingCodes] = useState<Record<string, string>>({});
    const [shippingDocumentOrder, setShippingDocumentOrder] = useState<Order | null>(null);
    
    // Admin Tickets States
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketSortConfig, setTicketSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

    // Admin Site Settings States
    const [formSiteSettings, setFormSiteSettings] = useState<Partial<SiteSettings>>({});
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    
    const [error, setError] = useState<string|null>(null);

    const loadDataForTab = useCallback(async (tab: ActiveTabType) => {
        if (!currentUser) return;
        setError(null);
        setIsLoadingData(true);
        try {
            switch (tab) {
                case 'profile':
                    const profile = await fetchMyProfile();
                    setUserProfile(profile);
                    break;
                case 'orders':
                    const myOrders = await fetchMyOrders();
                    setOrders(myOrders);
                    break;
                case 'adminOrders':
                    if (currentUser.isAdmin) {
                        const adminOrders = await apiFetchAdminOrders();
                        setOrders(adminOrders);
                    }
                    break;
                case 'adminProducts':
                    if (currentUser.isAdmin) {
                        const fetched = await apiFetchProducts();
                        setProducts(fetched);
                        setAllCategories([...new Set(fetched.map(p => p.category).filter(Boolean))].sort());
                    }
                    break;
                case 'adminCourses':
                    if (currentUser.isAdmin) {
                        const fetched = await apiFetchCourses();
                        setCourses(fetched);
                    }
                    break;
                case 'adminCourseAccess':
                    if (currentUser.isAdmin) {
                        const fetched = await apiFetchAccessRequests();
                        setAccessRequests(fetched);
                    }
                    break;
                case 'adminTickets':
                    if (currentUser.isAdmin) {
                        const fetched = await apiFetchTickets();
                        setTickets(fetched);
                    }
                    break;
                case 'adminSite':
                    if (currentUser.isAdmin) {
                        const fetchedSettings = await fetchAdminSiteSettings();
                        setFormSiteSettings(fetchedSettings);
                    }
                    break;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
        } finally {
            setIsLoadingData(false);
        }
    }, [currentUser]);
    
    useEffect(() => {
        const initialTab = new URLSearchParams(window.location.search).get('tab') as ActiveTabType || 'profile';
        if (currentUser) {
            setActiveTab(initialTab);
        }
    }, [currentUser?.id]);

    useEffect(() => { loadDataForTab(activeTab); }, [activeTab, loadDataForTab]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const sortedProducts = useMemo(() => [...products].sort((a, b) => {
        const key = productSortConfig.key as keyof Product;
        if (a[key] < b[key]) return productSortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return productSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    }), [products, productSortConfig]);

    const sortedCourses = useMemo(() => [...courses].sort((a, b) => {
        const key = courseSortConfig.key as keyof Course;
        if (a[key] < b[key]) return courseSortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return courseSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    }), [courses, courseSortConfig]);

    const sortedOrders = useMemo(() => [...orders].sort((a, b) => {
      const key = orderSortConfig.key as keyof Order;
      if (a[key] < b[key]) return orderSortConfig.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return orderSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }), [orders, orderSortConfig]);

    const sortedTickets = useMemo(() => [...tickets].sort((a, b) => {
        const key = ticketSortConfig.key as keyof Ticket;
        if (a[key] < b[key]) return ticketSortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return ticketSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    }), [tickets, ticketSortConfig]);

    const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
        setConfirmationState({ isOpen: true, title, message, onConfirm });
    };
    
    const handleSaveProduct = async (productData: Product | Omit<Product, 'id' | 'createdAt'> | Omit<Product, 'id' | 'createdAt'>[]) => {
        if (Array.isArray(productData)) {
            await apiAddMultipleProducts(productData);
        } else if ('id' in productData && productData.id) {
            await apiUpdateProduct(productData as Product);
        } else {
            await apiAddProduct(productData as Omit<Product, 'id' | 'createdAt'>);
        }
        await loadDataForTab('adminProducts');
    };
    
    const createDeleteHandler = (deleteFn: (id: string) => Promise<any>, loadFn: () => void, type: 'produto' | 'curso') => (id: string, name: string) => {
        confirmAction(`Excluir ${type}`, `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`, async () => {
            await deleteFn(id);
            await loadFn();
        });
    };
    
    const createBulkDeleteHandler = (deleteFn: (ids: string[]) => Promise<any>, selectedIds: string[], setSelectedIds: (ids: string[]) => void, loadFn: () => void, type: 'produtos' | 'cursos') => () => {
        confirmAction(`Excluir ${type}`, `Tem certeza que deseja excluir os ${selectedIds.length} ${type} selecionados?`, async () => {
            await deleteFn(selectedIds);
            setSelectedIds([]);
            await loadFn();
        });
    };

    const createFileUploadHandler = (uploadFn: (data: any[]) => Promise<any>, loadFn: () => void, setStatusFn: (status: any) => void, setUploadingFn: (is: boolean) => void, headers: string[], type: 'produtos' | 'cursos') => async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setStatusFn(null);
        if (!file) return;

        setUploadingFn(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvText = e.target?.result as string;
                const lines = csvText.trim().split(/\r?\n/).slice(1);
                if(lines.length === 0) throw new Error("O arquivo CSV está vazio ou contém apenas o cabeçalho.");
                
                const dataList = lines.map((line, lineIndex) => {
                    const data = line.split(',');
                    if (data.length !== headers.length) throw new Error(`A linha ${lineIndex + 2} tem ${data.length} colunas, mas ${headers.length} eram esperadas.`);
                    const record: any = {};
                    headers.forEach((header, index) => { record[header] = data[index]?.trim() || ''; });
                    return record;
                });

                await uploadFn(dataList);
                setStatusFn({ message: `${dataList.length} ${type} processados com sucesso.`, type: 'success' });
                await loadFn();
            } catch (err) {
                setStatusFn({ message: `Falha: ${err instanceof Error ? err.message : 'Erro no processamento do arquivo.'}`, type: 'error' });
            } finally {
                setUploadingFn(false);
                if(event.target) event.target.value = "";
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleSaveTrackingCode = async (orderId: string) => {
        const code = trackingCodes[orderId];
        if (!code) return;
        try {
            await updateOrderTracking(orderId, code);
            await loadDataForTab('adminOrders');
            setTrackingCodes(prev => ({ ...prev, [orderId]: '' }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar rastreio.");
        }
    };

    const handleSiteSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      
      const updatedValue = name === 'emailPort' ? parseInt(value, 10) || null : (type === 'checkbox' ? checked : value);

      setFormSiteSettings(prev => ({
          ...prev,
          [name]: updatedValue,
      }));
    };
    
    const handleSaveSiteSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const updatedSettings = await apiSaveSiteSettings(formSiteSettings);
            // After successful save, update local state from the response and refetch global state.
            setFormSiteSettings(updatedSettings);
            await refetchSiteSettings();
            addToast("Configurações salvas! O título da aba do navegador e os dados de SEO foram atualizados.", 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Erro ao salvar as configurações.", 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handlePayOrder = (order: Order) => {
        navigate('/checkout', { state: { orderToRetry: order } });
    };

    const handleCancelOrder = (order: Order) => {
        confirmAction(
            'Cancelar Pedido',
            `Tem certeza que deseja cancelar o Pedido #${order.id.substring(0, 8)}?`,
            async () => {
                await cancelMyOrder(order.id);
                await loadDataForTab('orders');
            }
        );
    };

    const handleUpdateTicketStatus = async (ticketId: string, status: 'OPEN' | 'CLOSED') => {
        await apiUpdateTicketStatus(ticketId, status);
        await loadDataForTab('adminTickets');
    };
    
    const handleDeleteTicket = (ticketId: string, name: string) => {
        confirmAction(
            'Excluir Ticket',
            `Tem certeza que deseja excluir o ticket de "${name}"?`,
            async () => {
                await apiDeleteTicket(ticketId);
                await loadDataForTab('adminTickets');
            }
        );
    };
    
    if (!isAuthenticated || !currentUser) {
        return <div className="text-center py-10">Redirecionando...</div>;
    }

    const TabButton: React.FC<{tabId: ActiveTabType, label: string, Icon: React.FC<React.SVGProps<SVGSVGElement>>}> = ({tabId, label, Icon}) => (
        <button type="button" onClick={() => setActiveTab(tabId)} aria-current={activeTab === tabId ? "page" : undefined}
            className={`flex items-center space-x-3 py-3 px-4 rounded-lg font-medium transition-all w-full text-left ${activeTab === tabId ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-body hover:bg-gray-100'}`}>
            <Icon className={`w-5 h-5 shrink-0 ${activeTab === tabId ? 'text-brand-primary' : 'text-text-muted'}`} /> <span>{label}</span>
        </button>
    );

    const getOrderStatusLabel = (status: string, trackingCode?: string) => {
        if (status === 'PAID') return trackingCode ? 'Enviado' : 'Pagamento Aprovado';
        if (status === 'PENDING') return 'Aguardando Pagamento';
        if (status === 'CANCELED') return 'Cancelado';
        return status;
    };

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    const renderTable = (type: string, data: any[], columns: { header: string, accessor: (item: any) => React.ReactNode, sortKey?: SortKey }[], sortConfig: SortConfig, setSortConfig: (config: SortConfig) => void, selectedIds?: string[], setSelectedIds?: React.Dispatch<React.SetStateAction<string[]>>, onBulkDelete?: () => void) => {
        const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedIds && setSelectedIds(e.target.checked ? data.map(item => item.id) : []);
        const handleSelectOne = (id: string) => setSelectedIds && setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        const requestSort = (key: SortKey) => {
            let direction: SortDirection = 'asc';
            if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
            setSortConfig({ key, direction });
        };
        const SortableHeader: React.FC<{column: typeof columns[0]}> = ({ column }) => {
            if (!column.sortKey) return <>{column.header}</>;
            const isSorted = sortConfig.key === column.sortKey;
            const directionIcon = sortConfig.direction === 'asc' ? '▲' : '▼';
            return <button className="flex items-center space-x-1" onClick={() => requestSort(column.sortKey!)}><span>{column.header}</span>{isSorted && <span className="text-xs">{directionIcon}</span>}</button>;
        };

        return (
            <div>
                 {isLoadingData && <p>Carregando...</p>}
                 {error && <p className="text-red-500">{error}</p>}
                 {!isLoadingData && !error && (
                     <>
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <div>{selectedIds && selectedIds.length > 0 && onBulkDelete && <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300" onClick={onBulkDelete}><TrashIcon className="w-4 h-4 mr-2"/>Excluir ({selectedIds.length})</Button>}</div>
                        </div>
                        <div className="overflow-x-auto shadow rounded-lg border border-border-light">
                            <table className="min-w-full divide-y divide-border-light bg-background-card">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {setSelectedIds && <th className="px-4 py-3 w-12 text-left"><input type="checkbox" onChange={handleSelectAll} checked={data.length > 0 && selectedIds.length === data.length} /></th>}
                                        {columns.map(col => <th key={col.header} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"><SortableHeader column={col} /></th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {data.map(item => (
                                        <tr key={item.id} className={`hover:bg-gray-50/50 ${selectedIds && selectedIds.includes(item.id) ? 'bg-brand-primary/5' : ''}`}>
                                            {setSelectedIds && <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} /></td>}
                                            {columns.map(col => <td key={col.header} className="px-4 py-3 whitespace-nowrap text-sm text-text-body align-top">{col.accessor(item)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {data.length === 0 && (
                            <div className="text-center p-8 text-text-muted border-x border-b rounded-b-lg">
                                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-2" />
                                <p className="font-semibold text-lg">Tudo certo por aqui!</p>
                                <p className="text-sm">Nenhum item para exibir.</p>
                            </div>
                        )}
                     </>
                 )}
            </div>
        );
    };
    
    return (
        <>
            {shippingDocumentOrder && <ShippingDocumentModal order={shippingDocumentOrder} siteSettings={contextSiteSettings} onClose={() => setShippingDocumentOrder(null)} />}
            <ConfirmationModal {...confirmationState} onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })} onConfirm={async () => { await confirmationState.onConfirm(); setConfirmationState({ ...confirmationState, isOpen: false }); }} />
            {isEditModalOpen && <ProductEditModal isOpen={isEditModalOpen} onClose={() => { setEditingProduct(null); setIsEditModalOpen(false); loadDataForTab('adminProducts'); }} onSave={handleSaveProduct} productToEdit={editingProduct} existingCategories={allCategories} />}
            {isCourseEditModalOpen && <CourseEditModal isOpen={isCourseEditModalOpen} onClose={() => setIsCourseEditModalOpen(false)} onSave={async (courseData) => { if ('id' in courseData) { await apiUpdateCourse(courseData as Course); } else { await apiAddCourse(courseData as CourseCreationData); } await loadDataForTab('adminCourses'); }} courseToEdit={editingCourse} />}
            
            <div className="py-8">
                <SectionTitle title="Painel de Controle" subtitle="Gerencie suas informações, pedidos e configurações do site." />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                    <aside className="md:w-1/4 lg:w-1/5 space-y-2 bg-background-card p-4 rounded-xl shadow-md border border-border-light self-start">
                        <TabButton tabId="profile" label="Meu Perfil" Icon={UserCircleIcon} />
                        <TabButton tabId="orders" label="Meus Pedidos" Icon={BriefcaseIcon} />
                        {currentUser.isAdmin && (
                            <div className="pt-4 mt-4 border-t border-border-light">
                                <h3 className="px-4 text-xs font-semibold uppercase text-text-muted mb-2 tracking-wider">Administração</h3>
                                <TabButton tabId="adminProducts" label="Produtos" Icon={ShoppingCartIcon} />
                                <TabButton tabId="adminCourses" label="Cursos" Icon={BookOpenIcon} />
                                <TabButton tabId="adminCourseAccess" label="Acessos a Cursos" Icon={KeyIcon} />
                                <TabButton tabId="adminOrders" label="Todos os Pedidos" Icon={BriefcaseIcon} />
                                <TabButton tabId="adminTickets" label="Tickets" Icon={TicketIcon} />
                                <TabButton tabId="adminSite" label="Config. Site" Icon={CogIcon} />
                            </div>
                        )}
                    </aside>

                    <main className="md:w-3/4 lg:w-4/5 bg-background-card p-6 sm:p-8 rounded-xl shadow-lg border border-border-light min-h-[400px]">
                       {activeTab === 'profile' && (userProfile ? <ProfileTab user={userProfile} onUpdate={() => loadDataForTab('profile')} /> : <p>Carregando perfil...</p>)}
                       {activeTab === 'orders' && (
                             <div>
                                <h3 className="text-2xl font-semibold mb-6">Meus Pedidos</h3>
                                {renderTable('meus-pedidos', sortedOrders, 
                                    [
                                      { header: 'Data', sortKey: 'createdAt', accessor: (item: Order) => new Date(item.createdAt).toLocaleDateString('pt-BR') },
                                      { header: 'Status', sortKey: 'status', accessor: (item: Order) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ getStatusClass(item.status) }`}>{getOrderStatusLabel(item.status, item.trackingCode)}</span> },
                                      { header: 'Total', sortKey: 'totalAmount', accessor: (item: Order) => `R$ ${Number(item.totalAmount).toFixed(2).replace('.', ',')}` },
                                      { header: 'Rastreio', accessor: (item: Order) => item.trackingUrl ? <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{item.trackingCode}</a> : 'N/A' },
                                      { header: 'Ações', accessor: (item: Order) => {
                                          if (item.status === 'PENDING') {
                                              return (
                                                  <div className="flex gap-2">
                                                      <Button size="sm" onClick={() => handlePayOrder(item)}>Pagar</Button>
                                                      <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleCancelOrder(item)}>Cancelar</Button>
                                                  </div>
                                              );
                                          }
                                          return null;
                                      }},
                                    ],
                                    orderSortConfig, setOrderSortConfig
                                )}
                            </div>
                       )}
                        {activeTab === 'adminProducts' && currentUser.isAdmin && (
                            <div>
                                <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-semibold">Gerenciamento de Produtos</h3><Button variant="primary" onClick={() => { setEditingProduct(null); setIsEditModalOpen(true); }}><PlusCircleIcon className="w-5 h-5 mr-2" />Adicionar Produto</Button></div>
                                <div className="bg-gray-50 p-4 rounded-lg border mb-6 space-y-2"><h4 className="font-medium">Carregar Planilha (.csv)</h4><p className="text-xs text-text-muted">Cabeçalho esperado: name,description,price,imageUrls,category,stock,sku</p><input type="file" accept=".csv" ref={productFileInputRef} onChange={createFileUploadHandler(apiAddMultipleProducts, () => loadDataForTab('adminProducts'), setProductUploadStatus, setIsUploadingProducts, ['name', 'description', 'price', 'imageUrls', 'category', 'stock', 'sku'], 'produtos')} className="hidden" /><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => productFileInputRef.current?.click()} disabled={isUploadingProducts}><DocumentArrowUpIcon className="w-4 h-4 mr-1.5" />{isUploadingProducts ? 'Enviando...' : 'Enviar CSV'}</Button><Button variant="outline" size="sm" onClick={() => { const link=document.createElement('a'); link.href='data:text/csv;charset=utf-8,'+encodeURI('name,description,price,imageUrls,category,stock,sku'); link.download='modelo_produtos.csv'; link.click();}}><DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />Baixar Modelo</Button></div>{productUploadStatus && <p className={`text-sm mt-2 p-2 rounded-md ${productUploadStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{productUploadStatus.message}</p>}</div>
                                {renderTable('produtos', sortedProducts, 
                                    [ 
                                        { header: 'Produto', sortKey: 'name', accessor: (item: Product) => <div className="flex items-center"><img src={item.imageUrls?.[0] || 'https://placehold.co/40'} alt={item.name} className="w-10 h-10 rounded-md object-cover mr-3" /><div><div className="font-medium text-text-headings">{item.name}</div><div className="text-xs text-text-muted">{item.sku}</div></div></div> }, 
                                        { header: 'Preço', sortKey: 'price', accessor: (item: Product) => `R$ ${Number(item.price).toFixed(2)}` }, 
                                        { header: 'Estoque', accessor: (item: Product) => item.stock }, 
                                        { header: 'Categoria', sortKey: 'category', accessor: (item: Product) => item.category },
                                        { header: 'Ações', accessor: (item: Product) => (
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => { setEditingProduct(item); setIsEditModalOpen(true); }}><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="outline" size="sm" onClick={() => createDeleteHandler(apiDeleteProduct, () => loadDataForTab('adminProducts'), 'produto')(item.id, item.name)}><TrashIcon className="w-4 h-4"/></Button>
                                            </div>
                                        )},
                                    ],
                                    productSortConfig, setProductSortConfig, selectedProductIds, setSelectedProductIds, createBulkDeleteHandler(apiDeleteMultipleProducts, selectedProductIds, setSelectedProductIds, () => loadDataForTab('adminProducts'), 'produtos')
                                )}
                            </div>
                        )}
                        {activeTab === 'adminCourses' && currentUser.isAdmin && (
                             <div>
                                <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-semibold">Gerenciamento de Cursos</h3><Button variant="primary" onClick={() => { setEditingCourse(null); setIsCourseEditModalOpen(true); }}><PlusCircleIcon className="w-5 h-5 mr-2" />Adicionar Curso</Button></div>
                                <div className="bg-gray-50 p-4 rounded-lg border mb-6 space-y-2"><h4 className="font-medium">Carregar Planilha (.csv)</h4><p className="text-xs text-text-muted">Cabeçalho: title,instructor,description,price,imageUrl,duration,level,type</p><input type="file" accept=".csv" ref={courseFileInputRef} onChange={createFileUploadHandler(apiAddMultipleCourses, () => loadDataForTab('adminCourses'), setCourseUploadStatus, setIsUploadingCourses, ['title', 'instructor', 'description', 'price', 'imageUrl', 'duration', 'level', 'type'], 'cursos')} className="hidden" /><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => courseFileInputRef.current?.click()} disabled={isUploadingCourses}><DocumentArrowUpIcon className="w-4 h-4 mr-1.5" />{isUploadingCourses ? 'Enviando...' : 'Enviar CSV'}</Button><Button variant="outline" size="sm" onClick={() => { const link=document.createElement('a'); link.href='data:text/csv;charset=utf-8,'+encodeURI('title,instructor,description,price,imageUrl,duration,level,type'); link.download='modelo_cursos.csv'; link.click();}}><DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />Baixar Modelo</Button></div>{courseUploadStatus && <p className={`text-sm mt-2 p-2 rounded-md ${courseUploadStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{courseUploadStatus.message}</p>}</div>
                                {renderTable('cursos', sortedCourses, 
                                    [ 
                                        { header: 'Curso', sortKey: 'title', accessor: (item: Course) => <div className="flex items-center"><img src={item.imageUrl || 'https://placehold.co/40'} alt={item.title} className="w-10 h-10 rounded-md object-cover mr-3" /><div><div className="font-medium text-text-headings">{item.title}</div><div className="text-xs text-text-muted">{item.instructor}</div></div></div> }, 
                                        { header: 'Preço', sortKey: 'price', accessor: (item: Course) => `R$ ${Number(item.price).toFixed(2)}` }, 
                                        { header: 'Tipo', accessor: (item: Course) => item.type }, { header: 'Nível', sortKey: 'level', accessor: (item: Course) => item.level }, 
                                        { header: 'Duração', accessor: (item: Course) => item.duration },
                                        { header: 'Ações', accessor: (item: Course) => (
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => { setEditingCourse(item); setIsCourseEditModalOpen(true); }}><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="outline" size="sm" onClick={() => createDeleteHandler(apiDeleteCourse, () => loadDataForTab('adminCourses'), 'curso')(item.id, item.title)}><TrashIcon className="w-4 h-4"/></Button>
                                            </div>
                                        )},
                                    ],
                                    courseSortConfig, setCourseSortConfig, selectedCourseIds, setSelectedCourseIds, createBulkDeleteHandler(apiDeleteMultipleCourses, selectedCourseIds, setSelectedCourseIds, () => loadDataForTab('adminCourses'), 'cursos')
                                )}
                            </div>
                        )}
                        {activeTab === 'adminCourseAccess' && currentUser.isAdmin && (
                            <div>
                                <h3 className="text-2xl font-semibold mb-6">Aprovação de Acesso a Cursos</h3>
                                {isLoadingData && <p>Carregando solicitações...</p>}
                                {error && <p className="text-red-500">{error}</p>}
                                {!isLoadingData && !error && (
                                  <div className="space-y-3">
                                    {accessRequests.length > 0 ? accessRequests.map(req => (
                                      <div key={req.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                                        <div>
                                          <p className="font-medium">{req.user.name} <span className="text-text-muted text-sm">({req.user.email})</span></p>
                                          <p className="text-sm text-text-muted">solicitou acesso ao curso: <strong className="text-brand-secondary">{req.course.title}</strong></p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="primary" onClick={async () => { await apiApproveAccessRequest(req.id); await loadDataForTab('adminCourseAccess'); }}>Aprovar</Button>
                                        </div>
                                      </div>
                                    )) : (
                                        <div className="text-center p-8 text-text-muted border rounded-lg bg-green-50/50 border-green-200">
                                            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-2" />
                                            <p className="font-semibold text-lg text-green-800">Tudo certo por aqui!</p>
                                            <p className="text-sm">Nenhuma solicitação de acesso pendente.</p>
                                        </div>
                                    )}
                                  </div>
                                )}
                            </div>
                        )}
                         {activeTab === 'adminOrders' && currentUser.isAdmin && (
                             <div>
                                <h3 className="text-2xl font-semibold mb-6">Todos os Pedidos</h3>
                                {renderTable('pedidos', sortedOrders, 
                                  [ 
                                    { header: 'Data', sortKey: 'createdAt', accessor: (item: Order) => new Date(item.createdAt).toLocaleDateString('pt-BR') },
                                    { header: 'Cliente', sortKey: 'customerName', accessor: (item: Order) => item.user?.name || item.customerName},
                                    { header: 'Status', sortKey: 'status', accessor: (item: Order) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>{getOrderStatusLabel(item.status, item.trackingCode)}</span> },
                                    { header: 'Total', sortKey: 'totalAmount', accessor: (item: Order) => `R$ ${Number(item.totalAmount).toFixed(2).replace('.', ',')}` },
                                    { header: 'Ações', accessor: (item: Order) => {
                                        const canShip = item.status === 'PAID' || !!item.trackingCode;
                                        if (item.status === 'CANCELED') return <span className="text-xs text-text-muted">Pedido Cancelado</span>;
                                        if (!canShip) return <span className="text-xs text-text-muted">Aguardando Pagamento</span>;
                                        return (
                                          <div className="flex flex-col gap-2 items-start">
                                              <div className="flex items-center gap-1">
                                                  <input 
                                                      type="text" 
                                                      placeholder="Código de Rastreio" 
                                                      className="p-1 border rounded-md text-sm w-32"
                                                      defaultValue={item.trackingCode || ''}
                                                      onChange={(e) => setTrackingCodes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                  />
                                                  <Button 
                                                      size="sm" 
                                                      onClick={() => handleSaveTrackingCode(item.id)}
                                                      disabled={!trackingCodes[item.id]}
                                                  >
                                                      Salvar
                                                  </Button>
                                              </div>
                                              <Button 
                                                  variant="outline" 
                                                  size="sm" 
                                                  onClick={() => setShippingDocumentOrder(item)}
                                                  className="flex items-center"
                                                  title="Gerar Documento de Envio"
                                              >
                                                  <DocumentArrowDownIcon className="w-4 h-4 mr-1"/> Gerar Doc.
                                              </Button>
                                          </div>
                                        );
                                    }}
                                  ],
                                  orderSortConfig, setOrderSortConfig
                                )}
                            </div>
                        )}
                        {activeTab === 'adminTickets' && currentUser.isAdmin && (
                            <div>
                                <h3 className="text-2xl font-semibold mb-6">Gerenciamento de Tickets de Contato</h3>
                                {renderTable('tickets', sortedTickets,
                                    [
                                        { header: 'Data', sortKey: 'createdAt', accessor: (item: Ticket) => new Date(item.createdAt).toLocaleString('pt-BR') },
                                        { header: 'Remetente', sortKey: 'name', accessor: (item: Ticket) => <div><p className="font-medium">{item.name}</p><p className="text-xs text-text-muted">{item.email}</p>{item.phone && <p className="text-xs text-text-muted mt-1">Tel: {item.phone}</p>}</div> },
                                        { header: 'Mensagem', accessor: (item: Ticket) => <p className="text-sm whitespace-pre-wrap max-w-sm">{item.message}</p> },
                                        { header: 'Status', sortKey: 'status', accessor: (item: Ticket) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{item.status === 'OPEN' ? 'Aberto' : 'Fechado'}</span> },
                                        { header: 'Ações', accessor: (item: Ticket) => (
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {item.status === 'OPEN' && (
                                                    <Button size="sm" onClick={() => handleUpdateTicketStatus(item.id, 'CLOSED')}>Marcar como Fechado</Button>
                                                )}
                                                <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDeleteTicket(item.id, item.name)}>Excluir</Button>
                                            </div>
                                        )}
                                    ],
                                    ticketSortConfig, setTicketSortConfig
                                )}
                            </div>
                        )}
                        {currentUser.isAdmin && activeTab === 'adminSite' && (
                          <div>
                              <h3 className="text-2xl font-semibold text-text-headings mb-6">Configurações Gerais do Site</h3>
                              {isLoadingData && !Object.keys(formSiteSettings).length ? (
                                  <p className="text-text-muted mb-4">Carregando configurações...</p>
                              ) : error ? (
                                  <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">Erro ao carregar: {error}</p>
                              ) : (
                                  <form onSubmit={handleSaveSiteSettings} className="space-y-8">
                                      <section className="p-6 border border-border-light rounded-lg bg-gray-50/50">
                                          <h4 className="text-xl font-medium text-brand-primary mb-4">Identidade Visual</h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <InputField label="Nome do Site" name="siteName" icon={CogIcon} value={formSiteSettings.siteName || ''} onChange={handleSiteSettingsChange} />
                                              <ImageUploadField label="Logo do Site" value={formSiteSettings.logoUrl || ''} onChange={(data) => setFormSiteSettings(prev => ({...prev, logoUrl: data.imageUrl}))} aiProcessing={false} />
                                              <ImageUploadField label="Favicon do Site" value={formSiteSettings.faviconUrl || ''} onChange={(data) => setFormSiteSettings(prev => ({...prev, faviconUrl: data.imageUrl}))} aiProcessing={false} />
                                              <InputField label="Descrição do Site (SEO)" name="siteDescription" isTextarea icon={CogIcon} value={formSiteSettings.siteDescription || ''} onChange={handleSiteSettingsChange} />
                                          </div>
                                      </section>

                                      <section className="p-6 border border-border-light rounded-lg bg-gray-50/50">
                                          <h4 className="text-xl font-medium text-brand-primary mb-4">Informações de Contato e Horários</h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <InputField label="Telefone de Contato" name="contactPhone" type="tel" icon={UserCircleIcon} value={formSiteSettings.contactPhone || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="E-mail de Contato" name="contactEmail" type="email" icon={UserCircleIcon} value={formSiteSettings.contactEmail || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="Endereço da Loja" name="storeAddress" isTextarea icon={MapPinIcon} value={formSiteSettings.storeAddress || formSiteSettings.address || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="Horário de Funcionamento" name="storeHours" isTextarea icon={ClockIcon} value={formSiteSettings.storeHours || ''} onChange={handleSiteSettingsChange} />
                                          </div>
                                      </section>

                                      <section className="p-6 border border-border-light rounded-lg bg-red-50/30">
                                          <h4 className="text-xl font-medium text-red-600 mb-4 flex items-center"><KeyIcon className="w-5 h-5 mr-2 text-red-500" />Integrações e Segurança</h4>
                                          <p className="text-xs text-red-700 bg-red-100 p-2 rounded-md mb-4"><strong>Atenção:</strong> Chaves de API são sensíveis. Deixe o campo em branco para não alterar o valor atual.</p>
                                          <div className="space-y-4">
                                              <InputField label="Chave de API Asaas" name="asaasApiKey" type="password" icon={KeyIcon} placeholder={formSiteSettings.asaasApiKey === 'Já configurado.' ? 'Já configurado. Deixe em branco para não alterar' : 'Deixe em branco para não alterar'} value={formSiteSettings.asaasApiKey === 'Já configurado.' ? '' : formSiteSettings.asaasApiKey || ''} onChange={handleSiteSettingsChange} autoComplete="new-password" />
                                              <InputField label="Segredo do Webhook Asaas" name="asaasWebhookSecret" type="password" icon={KeyIcon} placeholder={formSiteSettings.asaasWebhookSecret === 'Já configurado.' ? 'Já configurado. Deixe em branco para não alterar' : 'Deixe em branco para não alterar'} value={formSiteSettings.asaasWebhookSecret === 'Já configurado.' ? '' : formSiteSettings.asaasWebhookSecret || ''} onChange={handleSiteSettingsChange} autoComplete="new-password" />
                                              <InputField label="Chave Secreta JWT" name="jwtSecret" type="password" icon={KeyIcon} placeholder={formSiteSettings.jwtSecret === 'Já configurado.' ? 'Já configurado. Deixe em branco para não alterar' : 'Deixe em branco para não alterar'} value={formSiteSettings.jwtSecret === 'Já configurado.' ? '' : formSiteSettings.jwtSecret || ''} onChange={handleSiteSettingsChange} autoComplete="new-password" />
                                          </div>
                                      </section>
                                      
                                      <section className="p-6 border border-border-light rounded-lg bg-blue-50/30">
                                        <h4 className="text-xl font-medium text-blue-600 mb-4 flex items-center"><ServerIcon className="w-5 h-5 mr-2 text-blue-500" />Inteligência Artificial (Gemini)</h4>
                                        <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded-md mb-4">
                                            <strong>Atenção:</strong> Esta chave é usada para funcionalidades como o preenchimento automático de detalhes do produto a partir de uma imagem. Deixe o campo em branco para não alterar o valor atual.
                                        </p>
                                        <div className="relative">
                                            <InputField 
                                                label="Chave de API Gemini" 
                                                name="geminiApiKey" 
                                                type={showGeminiKey ? 'text' : 'password'} 
                                                icon={KeyIcon} 
                                                placeholder={formSiteSettings.geminiApiKey === 'Já configurado.' ? 'Já configurado. Deixe em branco para não alterar' : 'Deixe em branco para não alterar'} 
                                                value={formSiteSettings.geminiApiKey === 'Já configurado.' ? '' : formSiteSettings.geminiApiKey || ''} 
                                                onChange={handleSiteSettingsChange} 
                                                autoComplete="new-password" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                                                className="absolute top-[38px] right-3 text-gray-500 hover:text-gray-700"
                                                aria-label={showGeminiKey ? "Ocultar chave" : "Mostrar chave"}
                                            >
                                                {showGeminiKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </section>
                                      
                                      <section className="p-6 border border-border-light rounded-lg bg-blue-50/30">
                                          <h4 className="text-xl font-medium text-blue-600 mb-4 flex items-center"><EnvelopeIcon className="w-5 h-5 mr-2 text-blue-500" />Configuração de E-mail (SMTP)</h4>
                                          <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded-md mb-4">Necessário para verificação de e-mail e recuperação de senha. Deixe a senha em branco para não alterá-la.</p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <InputField label="Host do E-mail (SMTP)" name="emailHost" icon={CogIcon} placeholder="smtp.example.com" value={formSiteSettings.emailHost || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="Porta" name="emailPort" type="number" icon={CogIcon} placeholder="587" value={formSiteSettings.emailPort || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="Usuário" name="emailUser" icon={UserCircleIcon} placeholder="user@example.com" value={formSiteSettings.emailUser || ''} onChange={handleSiteSettingsChange} />
                                              <InputField label="E-mail Remetente (From)" name="emailFrom" icon={EnvelopeIcon} placeholder='"Nome do Site" <email@exemplo.com>' value={formSiteSettings.emailFrom || ''} onChange={handleSiteSettingsChange} />
                                          </div>
                                          <div className="mt-6">
                                               <InputField label="Senha" name="emailPass" type="password" icon={KeyIcon} placeholder={formSiteSettings.emailPass === 'Já configurado.' ? 'Já configurado. Deixe em branco para não alterar' : 'Deixe em branco para não alterar'} value={formSiteSettings.emailPass === 'Já configurado.' ? '' : formSiteSettings.emailPass || ''} onChange={handleSiteSettingsChange} autoComplete="new-password" />
                                          </div>
                                      </section>

                                      <div className="flex justify-end pt-4">
                                          <Button type="submit" variant="primary" size="lg" disabled={isSavingSettings}>{isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}</Button>
                                      </div>
                                  </form>
                              )}
                          </div>
                      )}
                    </main>
                </div>
            </div>
        </>
    );
};


// Componente para a Aba "Meu Perfil"
const ProfileTab: React.FC<{ user: User, onUpdate: () => void }> = ({ user, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: user.name, email: user.email, cpfCnpj: user.cpfCnpj || '', phone: user.phone || '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();
    const [isResending, setIsResending] = useState(false);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setError('');
        setFormData({ name: user.name, email: user.email, cpfCnpj: user.cpfCnpj || '', phone: user.phone || '' });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            const emailChanged = formData.email !== user.email;
            await updateMyProfile(formData);
            await onUpdate();
            setIsEditing(false);
            if (emailChanged) {
                addToast("Perfil atualizado! Um e-mail de verificação foi enviado para seu novo endereço.", 'success');
            } else {
                addToast("Perfil atualizado com sucesso!", 'success');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao atualizar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResendVerification = async () => {
        setIsResending(true);
        try {
            await resendVerificationEmail();
            addToast("E-mail de verificação reenviado com sucesso!", 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Falha ao reenviar e-mail.', 'error');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold">Meu Perfil</h3>
                {!isEditing && <Button variant="outline" size="sm" onClick={handleEditToggle}><PencilIcon className="w-4 h-4 mr-2" />Editar Perfil</Button>}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Nome Completo" name="name" value={formData.name} onChange={handleChange} />
                    <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    <InputField label="CPF/CNPJ" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleChange} />
                    <InputField label="Telefone" name="phone" value={formData.phone} onChange={handleChange} />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-4">
                        <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                        <Button type="button" variant="outline" onClick={handleEditToggle}>Cancelar</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4 text-text-body">
                    <p><strong>Nome:</strong> {user.name}</p>
                    <div className="flex items-center gap-3">
                      <p><strong>Email:</strong> {user.email}</p>
                      {user.emailVerified ? (
                        <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1"/> Verificado
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                             <ExclamationTriangleIcon className="w-3 h-3 mr-1"/> Não Verificado
                           </span>
                           <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={isResending}>
                             {isResending ? 'Enviando...' : 'Reenviar Verificação'}
                           </Button>
                        </div>
                      )}
                    </div>
                    <p><strong>CPF/CNPJ:</strong> {user.cpfCnpj || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {user.phone || 'Não informado'}</p>
                </div>
            )}
            
            <div className="mt-8 pt-6 border-t">
                 <h4 className="text-xl font-semibold mb-4">Meus Endereços</h4>
                 <div className="space-y-3">
                    {user.addresses && user.addresses.length > 0 ? user.addresses.map(addr => (
                         <div key={addr.id} className="p-3 border rounded-md bg-gray-50/50">
                            <p className="font-medium">{addr.street}, {addr.number}</p>
                            <p className="text-sm text-text-muted">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                        </div>
                    )) : <p className="text-text-muted">Nenhum endereço cadastrado.</p>}
                 </div>
            </div>
        </div>
    );
};

export default SettingsPage;