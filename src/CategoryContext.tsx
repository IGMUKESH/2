import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError } from './firebase';
import { OperationType } from './types';

interface CategoryContextType {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [categories, setCategories] = useState<string[]>(['सभी']);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const sortedCats = catsData.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      }).map(cat => cat.name);

      const uniqueCats = Array.from(new Set(sortedCats.filter(cat => cat !== 'सभी')));
      setCategories(['सभी', ...uniqueCats]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });
    return unsubscribe;
  }, []);

  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory, categories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
