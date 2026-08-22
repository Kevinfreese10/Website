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
  status = 'approved',
  authorId,
}: {
  search?: string;
  tag?: string;
  filterType?: 'all' | 'unsolved' | 'solved';
  status?: 'approved' | 'pending' | 'rejected' | 'all';
  authorId?: string;
} = {}) {
  try {
    const db = getAdminDb();
    let queryRef: any = db.collection('communityQuestions');

    if (filterType === 'solved') {
      queryRef = queryRef.where('isSolved', '==', true);
    } else if (filterType === 'unsolved') {
      queryRef = queryRef.where('isSolved', '==', false);
    }

    if (status !== 'all') {
      queryRef = queryRef.where('status', '==', status);
    }

    if (authorId) {
      queryRef = queryRef.where('authorId', '==', authorId);
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
      status: ['admin', 'staff'].includes(author.role) ? 'approved' : 'pending',
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

/**
 * Approve a pending question
 */
export async function approveQuestion(questionId: string, idToken?: string) {
  const authError = await requireCommunityAdmin(idToken);
  if (authError) return authError;

  try {
    const db = getAdminDb();
    await db.collection('communityQuestions').doc(questionId).update({
      status: 'approved',
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/partner/community');
    revalidatePath('/admin/community');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a pending question
 */
export async function rejectQuestion(questionId: string, idToken?: string) {
  const authError = await requireCommunityAdmin(idToken);
  if (authError) return authError;

  try {
    const db = getAdminDb();
    await db.collection('communityQuestions').doc(questionId).update({
      status: 'rejected',
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/partner/community');
    revalidatePath('/admin/community');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a question (Admin)
 */
export async function updateQuestion(questionId: string, data: { title?: string, content?: string, tags?: string[], likesCount?: number }, idToken?: string) {
  const authError = await requireCommunityAdmin(idToken);
  if (authError) return authError;

  try {
    const db = getAdminDb();
    
    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.tags !== undefined) updates.tags = data.tags.filter(Boolean);
    if (data.likesCount !== undefined) updates.likesCount = Number(data.likesCount);

    await db.collection('communityQuestions').doc(questionId).update(updates);
    
    revalidatePath('/partner/community');
    revalidatePath('/admin/community');
    revalidatePath(`/partner/community/${questionId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a question (Admin)
 */
export async function deleteQuestion(questionId: string, idToken?: string) {
  const authError = await requireCommunityAdmin(idToken);
  if (authError) return authError;

  try {
    const db = getAdminDb();
    
    // Deleting the document hides it from queries. 
    // Ideally subcollections should be recursively deleted if this was a production cleanup script,
    // but this suffices for the app functionality.
    await db.collection('communityQuestions').doc(questionId).delete();
    
    revalidatePath('/partner/community');
    revalidatePath('/admin/community');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return { success: false, error: error.message };
  }
}

import { getPartnerAiInstance } from '@/lib/gemini-key';

import { getVerifiedAuthContext } from '@/lib/server-auth';

/**
 * Moderation actions below were documented as "(Admin)" but performed no caller check, so anyone
 * could approve their own unmoderated content onto the public CAP community, silently edit any
 * question's title/content, or delete the community's content wholesale.
 */
async function requireCommunityAdmin(idToken?: string) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) return { success: false as const, error: 'Unauthorized: A valid authentication token is required.' };
  const role = authCtx.user.role;
  const isStaff = authCtx.isAdmin || ['admin','staff','cap_staff','cap_supervisor'].includes(role);
  if (!isStaff) return { success: false as const, error: 'Forbidden: Moderator access required.' };
  return null;
}


/**
 * Generate an AI answer for a question
 */
export async function generateAIAnswer(questionTitle: string, questionContent: string) {
  try {
    const partnerAi = await getPartnerAiInstance();
    const { text } = await partnerAi.generate({
      prompt: `You are an expert tax and accounting professional answering a question in a community forum for accounting professionals in South Africa.
Question Title: ${questionTitle}
Question Details: ${questionContent}

Write a professional, helpful, and accurate response. Keep it concise but comprehensive. Provide practical advice relevant to South African tax and accounting laws where applicable. DO NOT include any preamble like "Here is your answer:" or "Dear user,". Just write the answer directly.`,
    });
    
    return { success: true, text: text?.trim() || '' };
  } catch (error: any) {
    console.error('Error generating AI answer:', error);
    return { success: false, error: error.message || 'Failed to generate answer' };
  }
}
