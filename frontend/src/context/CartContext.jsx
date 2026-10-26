import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Active Cart Items
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('folioverse_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Saved for Later / Cart Wishlist Items
  const [savedItems, setSavedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('folioverse_saved_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart Addition History (Audit trail of items added)
  const [cartHistory, setCartHistory] = useState(() => {
    try {
      const history = localStorage.getItem('folioverse_cart_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  });

  // Locally Placed Order History
  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const orders = localStorage.getItem('folioverse_order_history');
      return orders ? JSON.parse(orders) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Persist Active Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioverse_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.warn('Failed to persist cart items to localStorage', err);
    }
  }, [cartItems]);

  // Persist Saved For Later to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioverse_saved_cart', JSON.stringify(savedItems));
    } catch (err) {
      console.warn('Failed to persist saved items to localStorage', err);
    }
  }, [savedItems]);

  // Persist Cart History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioverse_cart_history', JSON.stringify(cartHistory));
    } catch (err) {
      console.warn('Failed to persist cart history to localStorage', err);
    }
  }, [cartHistory]);

  // Persist Order History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioverse_order_history', JSON.stringify(orderHistory));
    } catch (err) {
      console.warn('Failed to persist order history to localStorage', err);
    }
  }, [orderHistory]);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message) => {
    setToastMessage(message);
  };

  const addToCart = (book, qty = 1) => {
    if (!book || book.stock <= 0) {
      showToast({ type: 'error', text: `Sorry, "${book?.title || 'Book'}" is sold out.` });
      return false;
    }

    // Record into Cart History
    setCartHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== book.id);
      return [
        {
          id: book.id,
          title: book.title,
          author: book.author,
          price: parseFloat(book.price),
          cover_image: book.cover_image,
          category: book.category,
          addedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 30);
    });

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.bookId === book.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, book.stock);
        if (newQty === existing.quantity && existing.quantity >= book.stock) {
          showToast({ type: 'warning', text: `Maximum available stock (${book.stock}) reached for this book.` });
          return prevItems;
        }
        showToast({ type: 'success', text: `Updated "${book.title}" in cart (${newQty} copies)` });
        return prevItems.map((item) =>
          item.bookId === book.id ? { ...item, quantity: newQty, maxStock: book.stock } : item
        );
      } else {
        const initialQty = Math.min(qty, book.stock);
        showToast({ type: 'success', text: `Added "${book.title}" to cart!` });
        return [
          ...prevItems,
          {
            bookId: book.id,
            id: book.id,
            title: book.title,
            author: book.author,
            price: parseFloat(book.price),
            cover_image: book.cover_image,
            category: book.category,
            subcategory: book.subcategory,
            maxStock: book.stock,
            quantity: initialQty,
          },
        ];
      }
    });

    return true;
  };

  const updateQuantity = (bookId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.bookId === bookId) {
          const clampedQty = Math.min(newQty, item.maxStock || 999);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (bookId) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.bookId === bookId);
      if (item) {
        showToast({ type: 'info', text: `Removed "${item.title}" from cart.` });
      }
      return prevItems.filter((i) => i.bookId !== bookId);
    });
  };

  const saveForLater = (bookId) => {
    const itemToSave = cartItems.find((i) => i.bookId === bookId);
    if (!itemToSave) return;

    setCartItems((prev) => prev.filter((i) => i.bookId !== bookId));
    setSavedItems((prev) => {
      if (prev.some((i) => i.bookId === bookId)) return prev;
      return [...prev, itemToSave];
    });
    showToast({ type: 'info', text: `Saved "${itemToSave.title}" for later.` });
  };

  const moveToCartFromSaved = (bookId) => {
    const itemToMove = savedItems.find((i) => i.bookId === bookId);
    if (!itemToMove) return;

    setSavedItems((prev) => prev.filter((i) => i.bookId !== bookId));
    setCartItems((prev) => [...prev, itemToMove]);
    showToast({ type: 'success', text: `Moved "${itemToMove.title}" back to active cart.` });
  };

  const removeSavedItem = (bookId) => {
    setSavedItems((prev) => prev.filter((i) => i.bookId !== bookId));
  };

  const recordOrder = (orderData) => {
    setOrderHistory((prev) => [orderData, ...prev]);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        cartHistory,
        orderHistory,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        saveForLater,
        moveToCartFromSaved,
        removeSavedItem,
        recordOrder,
        clearCart,
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
