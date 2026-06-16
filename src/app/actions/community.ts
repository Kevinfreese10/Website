'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { CommunityQuestion, CommunityAnswer } from '@/lib/types';

/**
 * Fetch community questions with search, tag, and filter type
 */
export async function getCommunityQuestions({
  search,
  tag,
  filterType = 'all',
}: {
  search?: string;
  tag?: string;
  filterType?: 'all' | 'unsolved' | 'solved';
} = {}) {
  try {
    const db = getAdminDb();
    let queryRef: any = db.collection('communityQuestions');

    if (filterType === 'solved') {
      queryRef = queryRef.where('isSolved', '==', true);
    } else if (filterType === 'unsolved') {
      queryRef = queryRef.where('isSolved', '==', false);
    }

    queryRef = queryRef.orderBy('createdAt', 'desc');

    const snap = await queryRef.get();
    let questions = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      } as CommunityQuestion;
    });

    // Filter in-memory for tags (since Firestore doesn't support complex flexible query arrays in combination easily)
    if (tag) {
      const cleanTag = tag.toLowerCase().trim();
      questions = questions.filter((q: CommunityQuestion) => q.tags?.some((t: string) => t.toLowerCase() === cleanTag));
    }

    // Filter in-memory for search keywords
    if (search) {
      const cleanSearch = search.toLowerCase().trim();
      questions = questions.filter((q: CommunityQuestion) => 
        q.title.toLowerCase().includes(cleanSearch) || 
        q.content.toLowerCase().includes(cleanSearch)
      );
    }

    return { success: true, questions };
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return { success: false, error: error.message || 'Failed to fetch questions', questions: [] };
  }
}

/**
 * Fetch a single question by ID
 */
export async function getCommunityQuestion(questionId: string) {
  try {
    const db = getAdminDb();
    const docSnap = await db.collection('communityQuestions').doc(questionId).get();
    if (!docSnap.exists) {
      return { success: false, error: 'Question not found' };
    }
    const data = docSnap.data() as any;
    const question = {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    } as CommunityQuestion;

    return { success: true, question };
  } catch (error: any) {
    console.error('Error fetching question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch answers for a question
 */
export async function getCommunityAnswers(questionId: string) {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('communityQuestions')
      .doc(questionId)
      .collection('answers')
      .orderBy('isCorrect', 'desc')
      .orderBy('likesCount', 'desc')
      .orderBy('createdAt', 'asc')
      .get();

    const answers = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as CommunityAnswer;
    });

    return { success: true, answers };
  } catch (error: any) {
    console.error('Error fetching answers:', error);
    return { success: false, error: error.message || 'Failed to fetch answers', answers: [] };
  }
}

/**
 * Ask a new question
 */
export async function askQuestion({
  title,
  content,
  tags,
  author,
}: {
  title: string;
  content: string;
  tags: string[];
  author: { uid: string; name: string; role: string };
}) {
  try {
    const db = getAdminDb();
    const docRef = db.collection('communityQuestions').doc();
    const newQuestion = {
      id: docRef.id,
      title: title.trim(),
      content: content.trim(),
      authorId: author.uid,
      authorName: author.name,
      authorRole: author.role,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      tags: tags.map(t => t.trim()).filter(Boolean),
      likesCount: 0,
      likedBy: [],
      answersCount: 0,
      isSolved: false,
    };

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(author.uid);
      
      transaction.set(docRef, newQuestion);
      transaction.update(userRef, {
        communityPoints: FieldValue.increment(1),
        questionsCount: FieldValue.increment(1),
      });
    });

    revalidatePath('/partner/community');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error asking question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Answer a question
 */
export async function answerQuestion({
  questionId,
  content,
  author,
}: {
  questionId: string;
  content: string;
  author: { uid: string; name: string; role: string };
}) {
  try {
    const db = getAdminDb();
    const questionRef = db.collection('communityQuestions').doc(questionId);
    const answersRef = questionRef.collection('answers').doc();

    const newAnswer = {
      id: answersRef.id,
      questionId,
      content: content.trim(),
      authorId: author.uid,
      authorName: author.name,
      authorRole: author.role,
      createdAt: FieldValue.serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      isCorrect: false,
    };

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(author.uid);
      
      transaction.set(answersRef, newAnswer);
      transaction.update(questionRef, {
        answersCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(userRef, {
        communityPoints: FieldValue.increment(2),
        answersCount: FieldValue.increment(1),
      });
    });

    revalidatePath(`/partner/community/${questionId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error answering question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle like on a question
 */
export async function toggleLikeQuestion({
  questionId,
  userId,
}: {
  questionId: string;
  userId: string;
}) {
  try {
    const db = getAdminDb();
    const questionRef = db.collection('communityQuestions').doc(questionId);

    await db.runTransaction(async (transaction) => {
      const qSnap = await transaction.get(questionRef);
      if (!qSnap.exists) throw new Error('Question does not exist');
      
      const qData = qSnap.data() as CommunityQuestion;
      const likedBy = qData.likedBy || [];
      const authorId = qData.authorId;
      const hasLiked = likedBy.includes(userId);

      const authorRef = db.collection('users').doc(authorId);

      if (hasLiked) {
        transaction.update(questionRef, {
          likedBy: FieldValue.arrayRemove(userId),
          likesCount: FieldValue.increment(-1),
        });
        transaction.update(authorRef, {
          communityPoints: FieldValue.increment(-5),
        });
      } else {
        transaction.update(questionRef, {
          likedBy: FieldValue.arrayUnion(userId),
          likesCount: FieldValue.increment(1),
        });
        transaction.update(authorRef, {
          communityPoints: FieldValue.increment(5),
        });
      }
    });

    revalidatePath('/partner/community');
    revalidatePath(`/partner/community/${questionId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling like on question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle like on an answer
 */
export async function toggleLikeAnswer({
  questionId,
  answerId,
  userId,
}: {
  questionId: string;
  answerId: string;
  userId: string;
}) {
  try {
    const db = getAdminDb();
    const answerRef = db
      .collection('communityQuestions')
      .doc(questionId)
      .collection('answers')
      .doc(answerId);

    await db.runTransaction(async (transaction) => {
      const aSnap = await transaction.get(answerRef);
      if (!aSnap.exists) throw new Error('Answer does not exist');
      
      const aData = aSnap.data() as CommunityAnswer;
      const likedBy = aData.likedBy || [];
      const authorId = aData.authorId;
      const hasLiked = likedBy.includes(userId);

      const authorRef = db.collection('users').doc(authorId);

      if (hasLiked) {
        transaction.update(answerRef, {
          likedBy: FieldValue.arrayRemove(userId),
          likesCount: FieldValue.increment(-1),
        });
        transaction.update(authorRef, {
          communityPoints: FieldValue.increment(-5),
        });
      } else {
        transaction.update(answerRef, {
          likedBy: FieldValue.arrayUnion(userId),
          likesCount: FieldValue.increment(1),
        });
        transaction.update(authorRef, {
          communityPoints: FieldValue.increment(5),
        });
      }
    });

    revalidatePath(`/partner/community/${questionId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling like on answer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark an answer as solved
 */
export async function markAnswerSolved({
  questionId,
  answerId,
  userId,
}: {
  questionId: string;
  answerId: string;
  userId: string;
}) {
  try {
    const db = getAdminDb();
    const questionRef = db.collection('communityQuestions').doc(questionId);
    const answerRef = questionRef.collection('answers').doc(answerId);

    await db.runTransaction(async (transaction) => {
      const qSnap = await transaction.get(questionRef);
      if (!qSnap.exists) throw new Error('Question does not exist');
      const qData = qSnap.data() as CommunityQuestion;

      if (qData.authorId !== userId) {
        throw new Error('Only the author of the question can mark solutions');
      }

      const aSnap = await transaction.get(answerRef);
      if (!aSnap.exists) throw new Error('Answer does not exist');
      const aData = aSnap.data() as CommunityAnswer;

      const answerAuthorId = aData.authorId;
      const answerAuthorRef = db.collection('users').doc(answerAuthorId);

      transaction.update(questionRef, {
        isSolved: true,
        solvedAnswerId: answerId,
      });

      transaction.update(answerRef, {
        isCorrect: true,
      });

      transaction.update(answerAuthorRef, {
        communityPoints: FieldValue.increment(15),
        solutionsCount: FieldValue.increment(1),
      });
    });

    revalidatePath(`/partner/community/${questionId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error marking answer solved:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get top community contributors for leaderboard
 */
export async function getLeaderboard() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('users')
      .where('communityPoints', '>', 0)
      .orderBy('communityPoints', 'desc')
      .limit(10)
      .get();

    const leaderboard = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        companyName: data.companyName || '',
        communityPoints: data.communityPoints || 0,
        questionsCount: data.questionsCount || 0,
        answersCount: data.answersCount || 0,
        solutionsCount: data.solutionsCount || 0,
        role: data.role || 'partner',
      };
    });

    return { success: true, leaderboard };
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: error.message || 'Failed to fetch leaderboard', leaderboard: [] };
  }
}
