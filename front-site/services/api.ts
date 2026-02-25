
import { Product, Course, SiteSettings, User, PaymentPayload, Order, Plan, Subscription, CourseCreationData, PlanAnswers, CreditCardData, CourseAccessRequest, Address, AddressFormData, RetryPaymentPayload, Ticket, ProductQuestion, ProductReview, CartItem } from '../types';

// Use um environment variable para produção/IPs específicos, com um fallback para desenvolvimento local com APK.
// Para Emuladores Android, 10.0.2.2 é o IP especial para conectar ao localhost da máquina hospedeira.
// Para um dispositivo físico na mesma rede Wi-Fi, você criaria um arquivo .env com:
// VITE_API_URL=http://SEU_IP_DO_COMPUTADOR:443/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const handleResponse = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();
  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch (e) {
      errorData = { message: text || response.statusText };
    }
    throw new Error(errorData.errors?.[0]?.description || errorData.message || `Erro HTTP: ${response.status}`);
  }
  if (response.status === 204 || !text) {
    return null;
  }
  return JSON.parse(text) as T;
};


// --- Authentication & User ---
export const login = async (email: string, passwordInput: string): Promise<{ token: string, user: User }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrCpf: email, password: passwordInput }),
  });
  return handleResponse<{ token: string, user: User }>(response);
};

export const register = async (name: string, email: string, password: string): Promise<{ token: string, user: User }> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<{ token: string, user: User }>(response);
};

export const verifyEmail = async (token: string): Promise<{ token: string; user: User; message: string; }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return handleResponse<{ token: string; user: User; message: string; }>(response);
};

export const resendVerificationEmail = async (): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
};

export const forgotPassword = async (email: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse<any>(response);
};

export const resetPassword = async (token: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  return handleResponse<any>(response);
};


export const fetchMyProfile = async (): Promise<User> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse<User>(response);
};

export const updateMyProfile = async (profileData: Partial<User>): Promise<User> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(profileData),
  });
  return handleResponse<User>(response);
};

export const fetchMyCards = async (): Promise<any[]> => {
    // This is a placeholder. In a real application, you would fetch saved card details.
    // The backend should return masked card numbers for security.
    console.log("Simulating fetching user cards...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                // Example data:
                // { id: 'card_xyz123', brand: 'Visa', last4: '4242' }
            ]);
        }, 300);
    });
};

export const addCard = async (cardData: CreditCardData): Promise<any> => {
    // This is a placeholder. In a real application, you would send tokenized card data.
    console.log("Simulating adding a new card:", { ...cardData, number: `**** **** **** ${cardData.number.slice(-4)}` });
     return new Promise(resolve => {
        setTimeout(() => {
            resolve({ id: `card_${Math.random()}`, brand: 'Visa', last4: cardData.number.slice(-4) });
        }, 500);
    });
}


// --- Image Upload & Processing ---
export const uploadAndProcessProductImage = async (file: File): Promise<{ imageUrl: string } & Partial<Product>> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    return handleResponse<{ imageUrl: string } & Partial<Product>>(response);
};

export const uploadImageOnly = async (file: File): Promise<{ imageUrl: string }> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/image-only`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    return handleResponse<{ imageUrl: string }>(response);
};


// --- Addresses ---
export const fetchMyAddresses = async (): Promise<Address[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return (await handleResponse<Address[]>(response)) || [];
};

export const addAddress = async (addressData: AddressFormData): Promise<Address> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressData)
    });
    return handleResponse<Address>(response);
};

// --- CEP Lookup ---
export const fetchCep = async (cep: string): Promise<any> => {
    const cleanedCep = cep.replace(/\D/g, '');
    const response = await fetch(`${API_BASE_URL}/cep/${cleanedCep}`);
    return handleResponse<any>(response);
};

// --- Shipping Simulation ---
export const calculateShippingOptions = async (cep: string): Promise<any[]> => {
    console.log(`Simulating shipping calculation for CEP: ${cep}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { type: 'Normal', cost: 15.90, days: '5 a 7 dias úteis' },
                { type: 'Expresso', cost: 28.50, days: '2 a 3 dias úteis' },
            ]);
        }, 500);
    });
};


// --- Products ---
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  const data = await handleResponse<Product[]>(response);
  return data || [];
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (response.status === 404) return undefined;
  return handleResponse<Product>(response);
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(productData),
  });
  return handleResponse<Product>(response);
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/products/${updatedProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
    body: JSON.stringify(updatedProduct),
  });
  return handleResponse<Product>(response);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
};

export const addMultipleProducts = async (productsData: Omit<Product, 'id' | 'createdAt'>[]): Promise<{ count: number }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/products/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(productsData),
  });
  return handleResponse<{ count: number }>(response);
};

export const deleteMultipleProducts = async (productIds: string[]): Promise<{ count: number }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/products/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ids: productIds }),
  });
  return handleResponse<{ count: number }>(response);
};

// --- Product Questions & Reviews ---
export const postQuestion = async (productId: string, question: string): Promise<ProductQuestion> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/questions/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question }),
    });
    return handleResponse<ProductQuestion>(response);
};

export const postReview = async (productId: string, review: { rating: number; title: string; comment: string }): Promise<ProductReview> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reviews/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(review),
    });
    return handleResponse<ProductReview>(response);
};

// --- Courses ---
export const fetchCourses = async (): Promise<Course[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  return (await handleResponse<Course[]>(response)) || [];
};

export const fetchCourseById = async (id: string): Promise<Course | undefined> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  if (response.status === 404) return undefined;
  return handleResponse<Course>(response);
};

export const addCourse = async (courseData: CourseCreationData): Promise<Course> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(courseData),
  });
  return handleResponse<Course>(response);
};

export const updateCourse = async (updatedCourse: Course): Promise<Course> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/${updatedCourse.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
    body: JSON.stringify(updatedCourse),
  });
  return handleResponse<Course>(response);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
};

export const addMultipleCourses = async (coursesData: CourseCreationData[]): Promise<{ count: number }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(coursesData),
  });
  return handleResponse<{ count: number }>(response);
};

export const deleteMultipleCourses = async (courseIds: string[]): Promise<{ count: number }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ids: courseIds }),
  });
  return handleResponse<{ count: number }>(response);
};


// --- Course Access Requests ---
export const requestCourseAccess = async (courseId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/request-access`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}

export const fetchAccessRequests = async (): Promise<CourseAccessRequest[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/access-requests`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return (await handleResponse<CourseAccessRequest[]>(response)) || [];
}

export const approveAccessRequest = async (requestId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/courses/access-requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}


// --- Site Settings ---
export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const response = await fetch(`${API_BASE_URL}/settings`);
  return handleResponse<SiteSettings>(response);
};

export const fetchAdminSiteSettings = async (): Promise<SiteSettings> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/settings/admin`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse<SiteSettings>(response);
};

export const saveSiteSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  const data = await handleResponse<{ settings: SiteSettings }>(response);
  if (!data) {
    throw new Error("Failed to save site settings, no data returned.");
  }
  return data.settings;
};

// --- Product Suggestions ---
export const fetchSuggestedProducts = async (currentProductId?: string, category?: string | null, count: number = 3): Promise<Product[]> => {
  const allProducts = await fetchProducts();
  let suggestions = allProducts.filter(p => p.stock && p.stock > 0);
  
  if (category) {
    const categoryProducts = suggestions.filter(p => p.category === category && p.id !== currentProductId);
    suggestions = categoryProducts.concat(suggestions.filter(p => p.category !== category && p.id !== currentProductId));
  } else {
    suggestions = suggestions.filter(p => p.id !== currentProductId);
  }
  
  return suggestions.slice(0, count);
};

// --- Cart ---
export const fetchMyCart = async (): Promise<CartItem[]> => {
    const token = getAuthToken();
    if (!token) return []; // Return empty for non-logged-in users
    const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return (await handleResponse<CartItem[]>(response)) || [];
};

export const syncMyCart = async (cartItems: CartItem[]): Promise<CartItem[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado.");

    // The backend only needs a minimal representation to sync
    const payload = cartItems.map(item => ({
        id: item.id,
        itemType: item.itemType,
        quantity: item.quantity,
    }));

    const response = await fetch(`${API_BASE_URL}/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    return (await handleResponse<CartItem[]>(response)) || [];
};


// --- Payment ---
export const initiatePayment = async (payload: PaymentPayload): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Usuário não autenticado. Faça login para prosseguir.");

  const response = await fetch(`${API_BASE_URL}/payment/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(response);
};

export const fetchOrderPaymentDetails = async (paymentId: string): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/payment/${paymentId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse<any>(response);
};

export const retryOrderPayment = async (orderId: string, payload: RetryPaymentPayload): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Usuário não autenticado.");

  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/retry-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(response);
};


// --- Orders ---
export const fetchOrders = async (): Promise<Order[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return (await handleResponse<Order[]>(response)) || [];
};

export const fetchMyOrders = async (): Promise<Order[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return (await handleResponse<Order[]>(response)) || [];
};

export const cancelMyOrder = async (orderId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse<void>(response);
};

export const hasPurchased = async (productId: string): Promise<{ hasPurchased: boolean }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/orders/my-orders/has-purchased/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse<{ hasPurchased: boolean }>(response);
}


export const updateOrderTracking = async (orderId: string, trackingCode: string): Promise<Order> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trackingCode }),
    });
    return handleResponse<Order>(response);
};

// --- Plans & Subscriptions ---
export const fetchPlans = async (): Promise<Plan[]> => {
  const response = await fetch(`${API_BASE_URL}/plans`);
  return (await handleResponse<Plan[]>(response)) || [];
};

export const createSubscription = async (planId: string, paymentInfo: any): Promise<Subscription> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ planId, paymentInfo }),
  });
  return handleResponse<Subscription>(response);
};

export const createCustomSubscription = async (
  planDetails: { name: string; price: number; description: string, answers: PlanAnswers },
  paymentInfo: { creditCard: CreditCardData, holderInfo: any }
): Promise<Subscription> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/subscriptions/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ planDetails, paymentInfo }),
  });
  return handleResponse<Subscription>(response);
};

// --- Tickets ---
export const createTicket = async (ticketData: { name: string; email: string; phone?: string; message: string }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
    });
    return handleResponse<any>(response);
};

export const fetchTickets = async (): Promise<Ticket[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return (await handleResponse<Ticket[]>(response)) || [];
};

export const updateTicketStatus = async (ticketId: string, status: 'OPEN' | 'CLOSED'): Promise<Ticket> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
    });
    return handleResponse<Ticket>(response);
};

export const deleteTicket = async (ticketId: string): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    await handleResponse<void>(response);
};