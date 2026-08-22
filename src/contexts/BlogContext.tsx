
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { BlogPost } from '@/lib/types';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(firebaseApp);

interface BlogContextType {
  blogPosts: BlogPost[];
  addPost: (post: Omit<BlogPost, 'id' | 'slug' | 'date'>) => Promise<void>;
  updatePost: (post: BlogPost) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  isLoading: boolean;
  /** Signals that this consumer needs blog data; triggers the (single) fetch. */
  requestBlogPosts: () => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

/**
 * Blog posts are loaded LAZILY — only once something actually consumes them.
 *
 * `BlogProvider` wraps `AppShell`, which wraps every route in the application. This effect
 * previously ran on mount, so the entire `blogPosts` collection — including each post's full
 * article HTML in the `content` field — was downloaded on every single page view: the homepage,
 * all ~60 SEO landing pages, all 13 calculators, the cart, the checkout, and the whole of
 * /admin, /dashboard and /partner. It was the single largest Firestore read in the application
 * and almost none of those pages display a blog post.
 *
 * Consumers now trigger the fetch by calling useBlog(), which is a no-op for every route that
 * doesn't render blog content.
 */
export const BlogProvider = ({ children }: { children: ReactNode }) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const { toast } = useToast();

  const fetchBlogPosts = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "blogPosts"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          let dateStr = new Date().toISOString();
          if (data.date) {
             if (typeof data.date.toDate === 'function') {
                dateStr = data.date.toDate().toISOString();
             } else if (typeof data.date === 'string') {
                dateStr = new Date(data.date).toISOString();
             } else if (data.date instanceof Date) {
                dateStr = data.date.toISOString();
             }
          }

          return { 
            ...data, 
            id: doc.id,
            date: dateStr,
         } as BlogPost
        });
        setBlogPosts(fetchedPosts);
    } catch(error) {
        console.error("Error fetching blog posts:", error);
        toast({ title: 'Error', description: 'Could not fetch blog posts.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };
  
  // Fetch only after a consumer has asked for the data at least once.
  useEffect(() => {
    if (hasRequested) {
      fetchBlogPosts();
    }
  }, [hasRequested]);

  // Stable identity — useBlog() depends on it in an effect, so a new function each render
  // would re-run that effect on every render.
  const requestBlogPosts = useCallback(() => {
    setHasRequested(true);
  }, []);

  const addPost = async (postData: Omit<BlogPost, 'id' | 'slug' | 'date'>) => {
    const slug = postData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const newPost = {
      ...postData,
      slug,
      date: serverTimestamp(),
    };
    try {
        await addDoc(collection(db, "blogPosts"), newPost);
        fetchBlogPosts();
    } catch (error) {
        throw new Error("Failed to add blog post.");
    }
  };

  const updatePost = async (updatedPost: BlogPost) => {
    try {
        const { id, ...postData } = updatedPost;
        
        let dateToSave: Timestamp | Date;
        if (typeof postData.date === 'string') {
            dateToSave = Timestamp.fromDate(new Date(postData.date));
        } else {
            // It's already a Date object or something else Firestore can handle
            dateToSave = postData.date;
        }

        await setDoc(doc(db, "blogPosts", id), {
            ...postData,
            date: dateToSave,
        }, { merge: true });
        fetchBlogPosts();
    } catch (error) {
        console.error("Error updating post: ", error);
        throw new Error("Failed to update blog post.");
    }
  };

  const deletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, "blogPosts", postId));
        fetchBlogPosts();
    } catch (error) {
        throw new Error("Failed to delete blog post.");
    }
  };

  return (
    <BlogContext.Provider value={{ blogPosts, addPost, updatePost, deletePost, isLoading, requestBlogPosts }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }

  // Consuming the hook IS the signal that this route needs blog data. Routes that never call
  // useBlog() — which is the overwhelming majority — now cost zero blog reads.
  const { requestBlogPosts } = context;
  useEffect(() => {
    requestBlogPosts();
  }, [requestBlogPosts]);

  return context;
};
