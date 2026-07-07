import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setProductFilters } from '../../redux/slices/productsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { fetchCustomers, createCustomer } from '../../redux/slices/customersSlice';
import {
  addToCart, removeFromCart, updateQuantity,
  setCustomer, setDiscount, setOrderNote, clearCart, setAuthoritativeTotals
} from '../../redux/slices/cartSlice';
import { createOrder } from '../../redux/slices/ordersSlice';
import { processCashPayment } from '../../redux/slices/paymentsSlice';
import { QrPaymentModal } from '../../components/QrPaymentModal';
import api from '../../utils/api';
import {
  Search, Keyboard, Plus, UserPlus, ShoppingCart, 
  Trash2, CreditCard, Banknote, QrCode, FileText, CheckCircle, 
  RotateCcw, Sparkles, X, ChevronRight, Minimize2, Maximize2, AlertCircle, Store
} from 'lucide-react';

export const PosTerminal = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const products = useSelector((state) => state.products);
  const categories = useSelector((state) => state.categories);
  const customers = useSelector((state) => state.customers);
  const cart = useSelector((state) => state.cart);

  // References for keyboard shortcuts
  const searchInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const customerSelectRef = useRef(null);

  // Page States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Checkout States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'CASH' | 'CARD' | 'UPI'
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [isRazorpayConnected, setIsRazorpayConnected] = useState(true);

  // Fetch Razorpay status when checkout modal opens
  useEffect(() => {
    if (showCheckoutModal && user?.branchId) {
      api.get(`/api/branches/${user.branchId}/razorpay/status`)
        .then(res => {
          setIsRazorpayConnected(res.data.data.connected);
        })
        .catch(err => {
          console.error("Failed to check Razorpay connection status", err);
          setIsRazorpayConnected(true);
        });
    }
  }, [showCheckoutModal, user?.branchId]);

  // Active QR code polling modal state
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Completed Invoice State
  const [completedOrder, setCompletedOrder] = useState(null);

  // Local Held Cart State
  const [heldCart, setHeldCart] = useState(null);

  // Responsiveness state
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Fetch Categories & Initial Products Scoped to Branch
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchCustomers());
    if (user?.branchId) {
      dispatch(fetchProducts({ branchId: user.branchId, page: 0, size: 24 }));
    }
  }, [dispatch, user]);

  // Handle Category Filter changes
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    dispatch(fetchProducts({
      branchId: user.branchId,
      categoryId: categoryId === 'ALL' ? '' : categoryId,
      search: searchQuery,
      page: 0,
      size: 24
    }));
  };

  // Handle Search input changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    dispatch(fetchProducts({
      branchId: user.branchId,
      categoryId: selectedCategory === 'ALL' ? '' : selectedCategory,
      search: val,
      page: 0,
      size: 24
    }));
  };

  // Keyboard shortcut hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        discountInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        customerSelectRef.current?.focus();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (cart.items.length > 0 && !completedOrder) {
          setShowCheckoutModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.items, completedOrder]);

  const handleAddToCart = (product) => {
    if (product.stockQuantity <= 0) return;
    dispatch(addToCart(product));
  };

  const handleUpdateQty = (productId, delta) => {
    const item = cart.items.find(i => i.productId === productId);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        dispatch(removeFromCart(productId));
      } else {
        dispatch(updateQuantity({ productId, quantity: newQty }));
      }
    }
  };

  const handleDiscountChange = (val, type) => {
    dispatch(setDiscount({ type, amount: Number(val) }));
  };

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

    // Restrict phone to exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newCustomerPhone)) {
      alert("Mobile number must be exactly 10 digits (e.g. 9876543210).");
      return;
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newCustomerEmail && !emailRegex.test(newCustomerEmail)) {
      alert("Please enter a valid email address (e.g. alan@example.com).");
      return;
    }

    const result = await dispatch(createCustomer({
      fullName: newCustomerName,
      phone: newCustomerPhone,
      email: newCustomerEmail || null
    }));
    if (createCustomer.fulfilled.match(result)) {
      dispatch(setCustomer({ id: result.payload.id, name: result.payload.fullName }));
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      dispatch(fetchCustomers()); // Refetch
    }
  };

  const handleHoldOrder = () => {
    if (cart.items.length === 0) return;
    setHeldCart({ ...cart });
    dispatch(clearCart());
  };

  const handleResumeOrder = () => {
    if (!heldCart) return;
    dispatch(clearCart());
    heldCart.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        dispatch(addToCart({ id: item.productId, name: item.name, price: item.price, imageUrl: item.imageUrl }));
      }
    });
    dispatch(setCustomer({ id: heldCart.customerId, name: heldCart.customerName }));
    dispatch(setDiscount({ type: heldCart.discountType, amount: heldCart.discountAmount }));
    dispatch(setOrderNote(heldCart.orderNote));
    setHeldCart(null);
  };

  // Perform checkout action
  const handlePaymentSubmit = async () => {
    if (!paymentMethod) return;
    setCheckoutError(null);
    setIsSubmittingCheckout(true);

    try {
      if ((paymentMethod === 'UPI' || paymentMethod === 'CARD') && !isRazorpayConnected) {
        throw new Error("Razorpay is not connected for this branch. Please set up Razorpay or use Cash payment instead.");
      }

      // 1. Submit order draft to backend to create a pending order
      const orderPayload = {
        branchId: user.branchId,
        customerId: cart.customerId,
        discountType: cart.discountType,
        discountAmount: cart.discountAmount,
        orderNote: cart.orderNote,
        items: cart.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity
        }))
      };

      const orderResult = await dispatch(createOrder(orderPayload));
      if (!createOrder.fulfilled.match(orderResult)) {
        throw new Error(orderResult.payload || 'Failed to create order on server');
      }
      
      const createdOrder = orderResult.payload;

      // Safe Recalculation Check (Compare backend total amount against client calculations)
      if (Math.abs(createdOrder.totalAmount - cart.totalAmount) > 0.01) {
        dispatch(setAuthoritativeTotals({
          subtotal: createdOrder.subtotal,
          totalAmount: createdOrder.totalAmount
        }));
      }

      if (paymentMethod === 'CASH') {
        const received = Number(cashReceived);
        if (isNaN(received) || received < createdOrder.totalAmount) {
          throw new Error(`Amount received must be at least ₹${createdOrder.totalAmount.toFixed(2)}`);
        }

        // 2. Submit cash processing to backend
        const cashResult = await dispatch(processCashPayment({
          orderId: createdOrder.id,
          amountReceived: received
        }));

        if (processCashPayment.fulfilled.match(cashResult)) {
          // Success! Show invoice
          setCompletedOrder({
            ...createdOrder,
            paymentMethod: 'CASH',
            amountReceived: received,
            changeDue: received - createdOrder.totalAmount
          });
          dispatch(clearCart());
          setShowCheckoutModal(false);
          // Refetch products for updated stock
          dispatch(fetchProducts({ branchId: user.branchId, page: 0, size: 24 }));
        } else {
          throw new Error(cashResult.payload || 'Failed to register cash payment');
        }

      } else if (paymentMethod === 'UPI') {
        // Trigger UPI Modal and hide checkout selection
        setPendingOrderId(createdOrder.id);
        setShowCheckoutModal(false);
        setShowQrModal(true);
      } else if (paymentMethod === 'CARD') {
        // Mock card processing - direct success
        setCompletedOrder({
          ...createdOrder,
          paymentMethod: 'CARD',
          amountReceived: createdOrder.totalAmount,
          changeDue: 0
        });
        dispatch(clearCart());
        setShowCheckoutModal(false);
        dispatch(fetchProducts({ branchId: user.branchId, page: 0, size: 24 }));
      }

    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleQrPaymentSuccess = (paymentResponse) => {
    setShowQrModal(false);
    setCompletedOrder(payments.activeQr || {
      id: pendingOrderId,
      totalAmount: cart.totalAmount,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      taxAmount: cart.taxAmount,
      items: cart.items,
      paymentMethod: 'UPI'
    });
    setPendingOrderId(null);
    dispatch(clearCart());
    dispatch(fetchProducts({ branchId: user.branchId, page: 0, size: 24 }));
  };

  const handleQrPaymentFailure = (errorMsg) => {
    setShowQrModal(false);
    setCheckoutError(errorMsg);
    setShowCheckoutModal(true); // Re-open checkout selector
  };

  const handleNewOrder = () => {
    setCompletedOrder(null);
    setPaymentMethod(null);
    setCashReceived('');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)] min-h-0">
      
      {completedOrder ? (
        // Completed Order receipt interface
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Completed!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Order Ref: #{completedOrder.id || 'N/A'}</p>
          
          {/* Invoice Summary */}
          <div className="w-full max-w-sm border border-gray-100 dark:border-gray-800 rounded-xl p-4 my-6 text-left space-y-3 bg-gray-50 dark:bg-gray-950/40 text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">Subtotal:</span>
              <span>₹{completedOrder.subtotal?.toFixed(2)}</span>
            </div>
            {completedOrder.discountAmount > 0 && (
              <div className="flex justify-between text-rose-500 font-medium">
                <span>Discount:</span>
                <span>-₹{completedOrder.discountAmount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">Tax amount:</span>
              <span>₹{completedOrder.taxAmount?.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between font-bold text-base">
              <span>Grand Total:</span>
              <span className="text-brand-green">₹{completedOrder.totalAmount?.toFixed(2)}</span>
            </div>
            
            {completedOrder.paymentMethod === 'CASH' && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Cash Tendered:</span>
                  <span>₹{completedOrder.amountReceived?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-blue font-bold">
                  <span>Change Due:</span>
                  <span>₹{completedOrder.changeDue?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
              type="button"
            >
              <FileText className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={handleNewOrder}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-brand-green hover:bg-brand-green-700 text-white flex items-center gap-1.5 shadow-sm shadow-brand-green/20"
              type="button"
            >
              <Plus className="w-4.5 h-4.5" /> New Order
            </button>
          </div>
        </div>
      ) : (
        // Standard POS grid + cart layouts
        <>
          {/* LEFT/CENTER COLUMN: Product list and category chips */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
            {/* Search and Helper shortcuts */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products... (F1)"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 outline-none focus:border-brand-green transition-colors"
                />
              </div>

              {/* Shortcut guide banner */}
              <div className="hidden sm:flex items-center space-x-3 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-950/20">
                <Keyboard className="w-4 h-4 text-gray-400" />
                <span>[F1] Search</span>
                <span>[F2] Disc</span>
                <span>[F3] Cust</span>
                <span>[Ctrl+Enter] Pay</span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0">
              <button
                onClick={() => handleCategorySelect('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-brand-green text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                All Items
              </button>
              {categories.list.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-brand-green text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  type="button"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {products.status === 'loading' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="animate-pulse bg-gray-100 dark:bg-gray-850/60 rounded-xl h-36"></div>
                  ))}
                </div>
              )}

              {products.status === 'failed' && (
                <div className="text-center py-12 text-sm text-rose-500">{products.error || 'Failed to load products'}</div>
              )}

              {!user?.branchId && (
                <div className="text-center py-16 px-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 max-w-lg mx-auto">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-white">No Station Assigned</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    Your cashier account is currently not assigned to any branch. 
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Please log in as a Manager to assign this employee to a branch, or register/select a branch.
                  </p>
                </div>
              )}

              {user?.branchId && products.status === 'succeeded' && products.list.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-400">No products found in this category.</div>
              )}

              {user?.branchId && products.status === 'succeeded' && products.list.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {products.list.map((prod) => {
                    const isOutOfStock = prod.stockQuantity <= 0;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => handleAddToCart(prod)}
                        disabled={isOutOfStock}
                        type="button"
                        className={`group relative text-left border rounded-xl p-3 bg-white dark:bg-gray-950 flex flex-col justify-between transition-all duration-150 ${
                          isOutOfStock
                            ? 'border-gray-200 dark:border-gray-900 opacity-50 cursor-not-allowed'
                            : 'border-gray-150 dark:border-gray-850 hover:border-brand-green/80 dark:hover:border-brand-green/50 hover:shadow-md'
                        }`}
                      >
                        <div>
                          {/* Image preview (optional placeholder if null) */}
                          <div className="w-full h-20 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Store className="w-6 h-6 text-gray-300 dark:text-gray-700" />
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{prod.name}</h4>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{prod.sku}</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-xs sm:text-sm font-extrabold text-brand-green">₹{prod.price.toFixed(2)}</span>
                          <span className={`text-[10px] font-bold ${prod.stockQuantity <= prod.lowStockThreshold ? 'text-amber-500' : 'text-gray-400'}`}>
                            {isOutOfStock ? 'No Stock' : `${prod.stockQuantity} Left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Drawer Trigger Bar */}
            <div className="xl:hidden border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between shrink-0">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold shadow-sm"
                type="button"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>View Cart ({cart.items.length} items)</span>
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Amount</p>
                <p className="text-lg font-black text-brand-green">₹{cart.totalAmount.toFixed(2)}</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Permanent Cart Panel (desktop only) */}
          <div className="hidden xl:flex w-[380px] flex-col min-h-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 sm:p-5">
            <CartPanelContent 
              cart={cart}
              customers={customers}
              customerSelectRef={customerSelectRef}
              discountInputRef={discountInputRef}
              handleUpdateQty={handleUpdateQty}
              handleDiscountChange={handleDiscountChange}
              setShowCheckoutModal={setShowCheckoutModal}
              setShowCustomerModal={setShowCustomerModal}
              handleHoldOrder={handleHoldOrder}
              handleResumeOrder={handleResumeOrder}
              heldCart={heldCart}
            />
          </div>

          {/* Cart drawer overlay for mobile */}
          {showCartDrawer && (
            <div className="fixed inset-0 z-40 xl:hidden flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCartDrawer(false)} />
              <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 shrink-0">
                  <h3 className="text-base font-bold flex items-center gap-1.5"><ShoppingCart className="w-5 h-5 text-brand-green" /> Basket</h3>
                  <button onClick={() => setShowCartDrawer(false)} type="button"><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                  <CartPanelContent
                    cart={cart}
                    customers={customers}
                    customerSelectRef={customerSelectRef}
                    discountInputRef={discountInputRef}
                    handleUpdateQty={handleUpdateQty}
                    handleDiscountChange={handleDiscountChange}
                    setShowCheckoutModal={(open) => { setShowCheckoutModal(open); setShowCartDrawer(false); }}
                    setShowCustomerModal={setShowCustomerModal}
                    handleHoldOrder={handleHoldOrder}
                    handleResumeOrder={handleResumeOrder}
                    heldCart={heldCart}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Checkout selection modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckoutModal(false)} />
          <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowCheckoutModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Process Checkout Payment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Total payable: <span className="font-extrabold text-brand-green">₹{cart.totalAmount.toFixed(2)}</span></p>

            {!isRazorpayConnected && (
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-205 dark:border-amber-900 rounded-xl text-amber-700 dark:text-amber-400 flex items-start space-x-2 text-xs mb-4 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <strong>Razorpay Offline:</strong> UPI QR and Card payments are disabled for this branch. Please connect Razorpay or select <strong>Cash Tender</strong> instead.
                </span>
              </div>
            )}

            {checkoutError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-600 dark:text-rose-450 flex items-start space-x-2 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Payment options list */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { method: 'CASH', label: 'Cash Tender', icon: Banknote },
                { method: 'UPI', label: 'UPI QR', icon: QrCode },
                { method: 'CARD', label: 'Card Swipe', icon: CreditCard },
              ].map((opt) => {
                const Icon = opt.icon;
                const isDisabled = (opt.method === 'UPI' || opt.method === 'CARD') && !isRazorpayConnected;
                return (
                  <button
                    key={opt.method}
                    onClick={() => {
                      if (isDisabled) return;
                      setPaymentMethod(opt.method);
                      setCheckoutError(null);
                    }}
                    disabled={isDisabled}
                    className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all ${
                      isDisabled
                        ? 'border-gray-150 dark:border-gray-850 opacity-40 cursor-not-allowed text-gray-400'
                        : paymentMethod === opt.method
                          ? 'border-brand-green bg-brand-green/5 text-brand-green dark:text-brand-green-400 font-semibold'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 text-gray-600 dark:text-gray-300'
                    }`}
                    type="button"
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conditional input fields */}
            {paymentMethod === 'CASH' && (
              <div className="mb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Amount Tendered</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-green"
                />
                {Number(cashReceived) >= cart.totalAmount && (
                  <p className="text-xs text-brand-blue font-bold">Change to return: ₹{(Number(cashReceived) - cart.totalAmount).toFixed(2)}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                type="button"
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isSubmittingCheckout || !paymentMethod || (paymentMethod === 'CASH' && !cashReceived)}
                type="button"
                className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-brand-green hover:bg-brand-green-700 disabled:opacity-50"
              >
                {isSubmittingCheckout ? 'Confirming...' : 'Complete Payment'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customer Quick Registration Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomerModal(false)} />
          <div className="relative w-full max-w-sm transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowCustomerModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Customer</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-350">Full Name</label>
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Alan Smith"
                  required
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 outline-none focus:border-brand-green"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-355">Phone Number</label>
                <input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 outline-none focus:border-brand-green"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-355">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="e.g. alan@gmail.com"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 outline-none focus:border-brand-green"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Register Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Render QR Modal when running UPI transaction */}
      {showQrModal && pendingOrderId && (
        <QrPaymentModal
          orderId={pendingOrderId}
          onSuccess={handleQrPaymentSuccess}
          onFailure={handleQrPaymentFailure}
        />
      )}

    </div>
  );
};

// Inline helper component for rendering cart actions
const CartPanelContent = ({
  cart,
  customers,
  customerSelectRef,
  discountInputRef,
  handleUpdateQty,
  handleDiscountChange,
  setShowCheckoutModal,
  setShowCustomerModal,
  handleHoldOrder,
  handleResumeOrder,
  heldCart
}) => {
  const dispatch = useDispatch();

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    if (custId === '') {
      dispatch(setCustomer(null));
    } else {
      const match = customers.list.find(c => c.id === Number(custId));
      if (match) {
        dispatch(setCustomer({ id: match.id, name: match.fullName }));
      }
    }
  };

  return (
    <div className="flex flex-col h-full justify-between min-h-0 text-sm">
      {/* Header and Hold options */}
      <div className="shrink-0">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <span className="font-extrabold text-base flex items-center gap-1.5"><ShoppingCart className="w-5 h-5 text-brand-green" /> Shopping Basket</span>
          <div className="flex space-x-1.5">
            {heldCart ? (
              <button
                onClick={handleResumeOrder}
                className="text-xs font-semibold px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-lg hover:bg-brand-blue/20 transition-colors flex items-center gap-0.5"
                type="button"
              >
                <RotateCcw className="w-3 h-3" /> Resume
              </button>
            ) : (
              <button
                onClick={handleHoldOrder}
                disabled={cart.items.length === 0}
                className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
                type="button"
              >
                Hold Cart
              </button>
            )}
          </div>
        </div>

        {/* Customer Select dropdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Select Customer (F3)</label>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-xs text-brand-green font-bold flex items-center hover:text-brand-green-700"
              type="button"
            >
              <UserPlus className="w-3.5 h-3.5 mr-0.5" /> Quick Add
            </button>
          </div>
          <select
            ref={customerSelectRef}
            value={cart.customerId || ''}
            onChange={handleCustomerChange}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none"
          >
            <option value="">Walk-in Customer</option>
            {customers.list.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.fullName} ({cust.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable Cart item listings */}
      <div className="flex-1 overflow-y-auto pr-1 py-1 min-h-0 space-y-3">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 dark:text-gray-500">
            <ShoppingCart className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-xs font-semibold">Your basket is empty</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div
              key={item.productId}
              className="p-3 border border-gray-150 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <p className="font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-brand-green font-semibold mt-0.5">₹{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-2.5 shrink-0">
                {/* Quantity adjuster */}
                <div className="flex items-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-lg overflow-hidden h-7">
                  <button
                    onClick={() => handleUpdateQty(item.productId, -1)}
                    className="px-2 hover:bg-gray-100 text-gray-500"
                    type="button"
                  >
                    -
                  </button>
                  <span className="px-2.5 font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.productId, 1)}
                    className="px-2 hover:bg-gray-100 text-gray-500"
                    type="button"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => dispatch(removeFromCart(item.productId))}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded-lg"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Summary block */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-3 shrink-0">
        
        {/* Discount & Order Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Discount amount (F2)</label>
            <div className="flex border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl overflow-hidden mt-1.5 h-9">
              <input
                ref={discountInputRef}
                type="number"
                value={cart.discountAmount || ''}
                onChange={(e) => handleDiscountChange(e.target.value, cart.discountType || 'PERCENT')}
                placeholder="0"
                className="w-full px-2 text-xs outline-none bg-transparent"
              />
              <select
                value={cart.discountType || 'PERCENT'}
                onChange={(e) => handleDiscountChange(cart.discountAmount, e.target.value)}
                className="text-[10px] font-bold border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 outline-none px-1.5 text-gray-500"
              >
                <option value="PERCENT">%</option>
                <option value="FLAT">₹</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Order Note</label>
            <input
              value={cart.orderNote}
              onChange={(e) => dispatch(setOrderNote(e.target.value))}
              placeholder="e.g. fragile items"
              className="w-full px-3 mt-1.5 h-9 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 outline-none focus:border-brand-green"
            />
          </div>
        </div>

        {/* Calculated Totals breakdown */}
        <div className="py-2.5 border-y border-gray-100 dark:border-gray-800 space-y-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Basket Subtotal:</span>
            <span className="text-gray-800 dark:text-gray-200">₹{cart.subtotal.toFixed(2)}</span>
          </div>
          {cart.discountAmount > 0 && (
            <div className="flex justify-between text-rose-500">
              <span>Applied Discount:</span>
              <span>-₹{((cart.discountType === 'PERCENT' ? cart.subtotal * (cart.discountAmount / 100) : cart.discountAmount)).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (18% inclusive):</span>
            <span className="text-gray-800 dark:text-gray-200">₹{(cart.totalAmount * 0.18).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white">
            <span>Total Payable:</span>
            <span className="text-brand-green">₹{cart.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Primary Checkout Button */}
        <button
          onClick={() => setShowCheckoutModal(true)}
          disabled={cart.items.length === 0}
          className="w-full py-3 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-green/10 hover:shadow-brand-green/20 disabled:opacity-50 disabled:hover:bg-brand-green flex items-center justify-center gap-1.5"
          type="button"
        >
          <span>Process Payment (Ctrl+Enter)</span>
          <ChevronRight className="w-4.5 h-4.5" />
        </button>

      </div>
    </div>
  );
};

export default PosTerminal;
