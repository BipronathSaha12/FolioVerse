import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('folioverse_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioverse_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.warn('Failed to persist cart items to localStorage', err);
    }
  }, [cartItems]);

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
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
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
