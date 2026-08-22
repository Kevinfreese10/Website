
'use client';
import { useState, useEffect } from 'react';
import { BlogPost, Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Loader2, FileText, CheckCircle, XCircle, Facebook, Share2, Settings, CheckCircle2, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import BlogForm from '@/components/admin/BlogForm';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useBlog } from '@/contexts/BlogContext';
import { analyzeBlogPostSeo, AnalyzeBlogPostSeoOutput } from '@/ai/flows/analyze-blog-post-seo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { testFacebookConnectionAction, saveFacebookSettingsAction, postToFacebookPageAction } from '@/app/admin/social-marketing/actions';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

function SeoReportDialog({ result, postTitle }: { result: AnalyzeBlogPostSeoOutput | null, postTitle: string }) {
  if (!result) return null;

  const renderChecklist = (items: Record<string, { pass: boolean; feedback: string }>) => (
    <ul className="space-y-2">
      {Object.entries(items).map(([key, item]) => (
        <li key={key} className="flex items-center gap-3">
          {item.pass ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
          <div>
            <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="text-xs text-muted-foreground">{item.feedback}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>SEO Analysis for: {postTitle}</DialogTitle>
        <DialogDescription>
          This report analyzes the post against key SEO best practices.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[70vh] overflow-y-auto pr-4">
        <Accordion type="multiple" defaultValue={['keywordAndIntent', 'metadata', 'structure']} className="w-full space-y-4">
          <AccordionItem value="keywordAndIntent">
            <AccordionTrigger className="text-lg font-semibold">Keyword & Intent</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.keywordAndIntent)}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="metadata">
            <AccordionTrigger className="text-lg font-semibold">Metadata</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.metadata)}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="structure">
            <AccordionTrigger className="text-lg font-semibold">Structure</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.structure)}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="content">
            <AccordionTrigger className="text-lg font-semibold">Content</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.content)}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="links">
            <AccordionTrigger className="text-lg font-semibold">Links</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.links)}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="media">
            <AccordionTrigger className="text-lg font-semibold">Media</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.media)}</AccordionContent>
          </AccordionItem>
           <AccordionItem value="technical">
            <AccordionTrigger className="text-lg font-semibold">Technical</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.technical)}</AccordionContent>
          </AccordionItem>
           <AccordionItem value="trust">
            <AccordionTrigger className="text-lg font-semibold">Trust & Conversion</AccordionTrigger>
            <AccordionContent>{renderChecklist(result.trust)}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DialogContent>
  );
}


export default function AdminBlogPage() {
  const { blogPosts, addPost, updatePost, deletePost, isLoading } = useBlog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeBlogPostSeoOutput | null>(null);
  const [analyzingPost, setAnalyzingPost] = useState<BlogPost | null>(null);

  const { user, updateUser } = useAuth();
  
  // Facebook states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pageId, setPageId] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [resolvedPageAccessToken, setResolvedPageAccessToken] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState<{ pageName: string; pagePictureUrl: string | null } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<Record<string, 'idle' | 'publishing' | 'success' | 'failed'>>({});
  const [postFormat, setPostFormat] = useState<'link' | 'photo'>('link');

  // Selection state
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.facebookSettings) {
      setPageId(user.facebookSettings.pageId || '');
      setPageAccessToken(user.facebookSettings.pageAccessToken || '');
      setResolvedPageAccessToken(user.facebookSettings.pageAccessToken || '');
      if (user.facebookSettings.pageName) {
        setTestResult({
          pageName: user.facebookSettings.pageName,
          pagePictureUrl: user.facebookSettings.pagePictureUrl || null
        });
        setTestStatus('success');
      }
    }
  }, [user]);

  const handleTestConnection = async () => {
    if (!pageId || !pageAccessToken) {
      toast({
        title: "Validation Error",
        description: "Please enter both Page ID and Page Access Token.",
        variant: "destructive"
      });
      return;
    }

    setTestStatus('testing');
    setTestError('');
    setTestResult(null);

    try {
      const res = await testFacebookConnectionAction(pageId, pageAccessToken);
      if (res.success && res.pageName) {
        setTestStatus('success');
        setTestResult({
          pageName: res.pageName,
          pagePictureUrl: res.pagePictureUrl || null
        });
        setResolvedPageAccessToken(res.resolvedPageToken || pageAccessToken);
        toast({
          title: "Connection Success!",
          description: `Successfully connected to page "${res.pageName}".`
        });
      } else {
        setTestStatus('failed');
        setTestError(res.error || "Connection failed. Please check credentials.");
        toast({
          title: "Connection Failed",
          description: res.error || "Please verify credentials and page permissions.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestError(err.message || "An unexpected error occurred.");
    }
  };

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to save settings.",
        variant: "destructive"
      });
      return;
    }

    if (testStatus !== 'success' || !testResult) {
      toast({
        title: "Connection Required",
        description: "Please test and confirm the connection before saving settings.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      const tokenToSave = resolvedPageAccessToken || pageAccessToken;
      const res = await saveFacebookSettingsAction(
        user.uid,
        pageId,
        tokenToSave,
        testResult.pageName,
        testResult.pagePictureUrl || '',
        await getAuth(firebaseApp).currentUser?.getIdToken()
      );

      if (res.success) {
        updateUser({
          ...user,
          facebookSettings: {
            pageId: pageId.trim(),
            pageAccessToken: tokenToSave.trim(),
            pageName: testResult.pageName,
            pagePictureUrl: testResult.pagePictureUrl || ''
          }
        });
        toast({
          title: "Settings Saved",
          description: "Your Facebook integration settings have been updated successfully."
        });
        setIsSettingsOpen(false);
      } else {
        toast({
          title: "Save Failed",
          description: res.error || "Could not save settings to database.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePublishToFacebook = async (post: BlogPost) => {
    if (!user?.facebookSettings?.pageId) {
      setIsSettingsOpen(true);
      toast({
        title: "Setup Required",
        description: "Please set up your Facebook Page integration first."
      });
      return;
    }

    setPublishingStatus(prev => ({ ...prev, [post.id]: 'publishing' }));
    
    // Format message
    const message = `${post.title}\n\n${post.excerpt || post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}`;
    
    // Construct link url
    const linkUrl = `${SITE_URL}/blog/${post.slug}`;
    
    // Construct image url
    let imageUrl = post.imageUrl || '';
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `${SITE_URL}${imageUrl}`;
    }
    if (!imageUrl) {
      imageUrl = GLOBAL_OG_IMAGE;
    }

    try {
      const res = await postToFacebookPageAction(user.uid, message, {
        link: linkUrl,
        imageUrl: imageUrl,
        postMode: postFormat
      }, await getAuth(firebaseApp).currentUser?.getIdToken());

      if (res.success && res.postId) {
        setPublishingStatus(prev => ({ ...prev, [post.id]: 'success' }));
        toast({
          title: "Post Published!",
          description: (
            <div className="flex flex-col gap-1">
              <span>"{post.title}" was posted directly to Facebook.</span>
              <a 
                href={`https://facebook.com/${res.postId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline font-bold inline-flex items-center gap-1 mt-1 text-xs"
              >
                View published post <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ),
          duration: 7000
        });
      } else {
        setPublishingStatus(prev => ({ ...prev, [post.id]: 'failed' }));
        toast({
          title: "Publishing Failed",
          description: res.error || "Could not publish post to Facebook Page.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setPublishingStatus(prev => ({ ...prev, [post.id]: 'failed' }));
      toast({
        title: "Publishing Failed",
        description: err.message || "An error occurred while publishing.",
        variant: "destructive"
      });
    }
  };

  const handlePublishAllOrSelected = async () => {
    const postsToPublish = selectedPostIds.length > 0 
      ? blogPosts.filter(p => selectedPostIds.includes(p.id))
      : blogPosts;

    if (postsToPublish.length === 0) {
      toast({
        title: "No Posts",
        description: "There are no blog posts to publish.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.facebookSettings?.pageId) {
      setIsSettingsOpen(true);
      toast({
        title: "Setup Required",
        description: "Please set up your Facebook Page integration first."
      });
      return;
    }

    setIsPublishing(true);
    toast({
      title: "Bulk Posting Started",
      description: `Publishing ${postsToPublish.length} blog posts to Facebook Page...`
    });

    let successCount = 0;
    let failCount = 0;

    for (const post of postsToPublish) {
      setPublishingStatus(prev => ({ ...prev, [post.id]: 'publishing' }));
      
      const message = `${post.title}\n\n${post.excerpt || post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}`;
      const linkUrl = `${SITE_URL}/blog/${post.slug}`;
      let imageUrl = post.imageUrl || '';
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${SITE_URL}${imageUrl}`;
      }
      if (!imageUrl) {
        imageUrl = GLOBAL_OG_IMAGE;
      }

      try {
        const res = await postToFacebookPageAction(user.uid, message, {
          link: linkUrl,
          imageUrl: imageUrl,
          postMode: postFormat
        }, await getAuth(firebaseApp).currentUser?.getIdToken());

        if (res.success) {
          setPublishingStatus(prev => ({ ...prev, [post.id]: 'success' }));
          successCount++;
        } else {
          setPublishingStatus(prev => ({ ...prev, [post.id]: 'failed' }));
          failCount++;
        }
      } catch (e) {
        setPublishingStatus(prev => ({ ...prev, [post.id]: 'failed' }));
        failCount++;
      }

      // Wait 500ms between posts to avoid rate limit/spam detection
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsPublishing(false);
    if (successCount > 0) {
      toast({
        title: "Bulk Posting Complete",
        description: `Successfully posted ${successCount} of ${postsToPublish.length} blog posts to your page feed.`
      });
      setSelectedPostIds([]); // Clear selection
    } else {
      toast({
        title: "Bulk Posting Failed",
        description: "Failed to publish blog posts. Please check Facebook credentials.",
        variant: "destructive"
      });
    }
  };

  const toggleSelectPost = (id: string) => {
    setSelectedPostIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPostIds.length === blogPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(blogPosts.map(p => p.id));
    }
  };


  const handleAddPost = () => {
    setSelectedPost(null);
    setIsFormOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setIsFormOpen(true);
  };
  
  const handleDeletePost = async (postId: string) => {
    try {
        await deletePost(postId);
        toast({
            title: 'Blog Post Deleted',
            description: 'The post has been successfully removed.',
            variant: 'destructive',
        })
    } catch(e) {
        toast({
            title: 'Error',
            description: 'Could not delete the blog post.',
            variant: 'destructive',
        })
    }
  };

  const handleFormSubmit = async (postData: BlogPost) => {
    try {
        if (selectedPost) {
            await updatePost(postData);
            toast({
                title: 'Post Updated',
                description: 'The blog post has been saved.',
            });
        } else {
            const { id, slug, date, ...newPostData } = postData;
            await addPost(newPostData);
            toast({
                title: 'Post Created',
                description: 'The new blog post has been added successfully.',
            });
        }
        setIsFormOpen(false);
        setSelectedPost(null);
    } catch(e) {
         toast({
            title: 'Error',
            description: 'Could not save the blog post.',
            variant: 'destructive',
        });
    }
  };

  const handleAnalyze = async (post: BlogPost) => {
    setAnalyzingPost(post);
    setIsAnalysisOpen(true);
    setAnalysisResult(null); // Clear previous result
    try {
        const result = await analyzeBlogPostSeo({
            title: post.title,
            content: post.content,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            url: post.slug,
            imageUrl: post.imageUrl,
        });
        setAnalysisResult(result);
    } catch (e) {
        console.error("Analysis error", e);
        toast({ title: 'Analysis Failed', description: 'Could not analyze the blog post.', variant: 'destructive'});
        setIsAnalysisOpen(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Blog</h1>
          <p className="text-sm text-muted-foreground font-medium">Create, edit, analyze, and publish blog posts to Facebook.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
            className="h-10 font-bold px-4 gap-2 border-primary/20 bg-white hover:bg-slate-50"
          >
            <Facebook className="h-4 w-4 text-[#1877F2] fill-[#1877F2]" />
            Facebook Settings
          </Button>

          <Select value={postFormat} onValueChange={(v: any) => setPostFormat(v)}>
            <SelectTrigger className="w-[210px] bg-white h-10 font-bold border-primary/20">
              <SelectValue placeholder="Post Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">🔗 Link Card (Clickable Preview)</SelectItem>
              <SelectItem value="photo">🖼️ Photo Post (Direct Image)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handlePublishAllOrSelected}
            disabled={isPublishing || blogPosts.length === 0}
            variant="secondary"
            className="h-10 font-bold px-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Share2 className="h-4 w-4 text-primary" />
            )}
            {selectedPostIds.length > 0 
              ? `Publish Selected (${selectedPostIds.length})` 
              : 'Publish All'}
          </Button>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
             <DialogTrigger asChild>
                  <Button onClick={handleAddPost} className="h-10 font-black px-6 gap-2 shadow-sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Post
                  </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                      <DialogTitle>{selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                      <DialogDescription>
                          {selectedPost ? 'Update the details of this blog post.' : 'Fill out the form to add a new post.'}
                      </DialogDescription>
                  </DialogHeader>
                  <BlogForm 
                      post={selectedPost} 
                      onSubmit={handleFormSubmit}
                  />
             </DialogContent>
          </Dialog>
        </div>
      </div>

      {user?.facebookSettings?.pageId ? (
        <Alert className="bg-emerald-50 border-emerald-200 border-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-xs font-black uppercase text-emerald-800 tracking-widest">
            Facebook Integration Active
          </AlertTitle>
          <AlertDescription className="text-xs font-medium text-emerald-700 leading-relaxed mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {user.facebookSettings.pagePictureUrl && (
                <img 
                  src={user.facebookSettings.pagePictureUrl} 
                  alt="Page profile" 
                  className="w-5 h-5 rounded-full border border-emerald-200"
                />
              )}
              <span>Auto-posting directly to your page: <strong>{user.facebookSettings.pageName || user.facebookSettings.pageId}</strong></span>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-emerald-800 hover:text-emerald-950 font-bold text-xs underline justify-start animate-none"
              onClick={() => setIsSettingsOpen(true)}
            >
              Change Settings
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-amber-50 border-amber-200 border-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-xs font-black uppercase text-amber-800 tracking-widest">Facebook Setup Required</AlertTitle>
          <AlertDescription className="text-xs font-medium text-amber-700 leading-relaxed mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <span>Direct posting is disabled. Configure your Meta credentials to publish blog posts automatically.</span>
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-800 hover:text-amber-950 font-bold text-xs underline justify-start animate-none"
              onClick={() => setIsSettingsOpen(true)}
            >
              Configure Facebook Integration
            </Button>
          </AlertDescription>
        </Alert>
      )}

       <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            {analyzingPost && (
                <SeoReportDialog result={analysisResult} postTitle={analyzingPost.title} />
            )}
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>View, edit, and delete your blog posts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={blogPosts.length > 0 && selectedPostIds.length === blogPosts.length} 
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map(post => (
                <TableRow key={post.id} className={selectedPostIds.includes(post.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedPostIds.includes(post.id)} 
                      onCheckedChange={() => toggleSelectPost(post.id)} 
                    />
                  </TableCell>
                  <TableCell>
                      <Image src={post.imageUrl || GLOBAL_OG_IMAGE} alt={post.title} width={64} height={40} className="rounded-md object-cover" />
                  </TableCell>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                          <Link href={`/blog/${post.slug}`} className="hover:underline" target="_blank">{post.title}</Link>
                          {publishingStatus[post.id] === 'success' && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[9px] px-1 py-0 h-4 flex items-center gap-1 font-bold">
                                  <Facebook className="h-2.5 w-2.5 text-[#1877F2] fill-[#1877F2]" /> Published
                              </Badge>
                          )}
                          {publishingStatus[post.id] === 'publishing' && (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                      </div>
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{format(new Date(post.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem asChild>
                                <Link href={`/blog/${post.slug}`} target="_blank">View Post</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAnalyze(post)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Analyze SEO
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handlePublishToFacebook(post)}
                                disabled={publishingStatus[post.id] === 'publishing'}
                                className="flex items-center gap-2"
                            >
                                {publishingStatus[post.id] === 'publishing' ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : publishingStatus[post.id] === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Facebook className="h-4 w-4 text-[#1877F2] fill-[#1877F2]" />
                                )}
                                <span>
                                    {publishingStatus[post.id] === 'publishing' 
                                        ? 'Publishing...' 
                                        : publishingStatus[post.id] === 'success' 
                                            ? 'Published!' 
                                            : 'Publish to Facebook'}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the post:
                                <span className="font-semibold"> {post.title}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Facebook Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                      <Facebook className="h-5 w-5 text-[#1877F2] fill-[#1877F2]" />
                      Facebook Page Integration
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                      Configure your page credentials to post blog updates directly to your Facebook Page.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="page-id" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Facebook Page ID
                      </Label>
                      <Input 
                          id="page-id"
                          placeholder="e.g., 109703190755392"
                          value={pageId}
                          onChange={(e) => {
                              setPageId(e.target.value);
                              setTestStatus('idle');
                          }}
                          className="border-slate-200"
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="page-token" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Page Access Token
                      </Label>
                      <Input 
                          id="page-token"
                          type="password"
                          placeholder="Paste your Facebook Page Access Token"
                          value={pageAccessToken}
                          onChange={(e) => {
                              setPageAccessToken(e.target.value);
                              setTestStatus('idle');
                          }}
                          className="border-slate-200"
                      />
                  </div>

                  {/* Connection Verification Feedback */}
                  {testStatus === 'testing' && (
                      <div className="flex items-center gap-2 p-3 text-xs bg-slate-50 border rounded-lg text-slate-600 font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Verifying credentials with Meta Graph API...</span>
                      </div>
                  )}

                  {testStatus === 'success' && testResult && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                          {testResult.pagePictureUrl && (
                              <img 
                                  src={testResult.pagePictureUrl} 
                                  alt="Page avatar" 
                                  className="w-10 h-10 rounded-full border border-emerald-200 object-cover"
                              />
                          )}
                          <div className="flex-grow">
                              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                                  Verified Successfully
                              </p>
                              <p className="text-emerald-700 mt-0.5 font-medium">
                                  Page Name: <strong>{testResult.pageName}</strong>
                              </p>
                          </div>
                      </div>
                  )}

                  {testStatus === 'failed' && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="font-bold flex items-center gap-1.5 text-rose-900">
                              <AlertTriangle className="h-4 w-4 text-rose-600 fill-rose-100" />
                              Connection Verification Failed
                          </p>
                          <p className="text-rose-700 mt-1 font-mono text-[10px] break-all leading-normal">
                              {testError}
                          </p>
                      </div>
                  )}

                  {/* Collapsible Setup Instructions */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                          <Info className="h-3 w-3 text-slate-400" /> Setup Instructions
                      </h4>
                      <ol className="list-decimal pl-4 text-xs space-y-1.5 text-slate-600 leading-normal font-medium">
                          <li>Log in to the <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">Meta Developers Portal <ExternalLink className="h-2.5 w-2.5" /></a> and create a Business App.</li>
                          <li>Navigate to the **Graph API Explorer** tool.</li>
                          <li>Select your developer app, choose **User Token**, and request permissions: `pages_manage_posts` and `pages_read_engagement`.</li>
                          <li>In the Token dropdown, select your **Facebook Page** under Page Tokens. Copy the Page Access Token.</li>
                      </ol>
                  </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                      variant="outline" 
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing' || !pageId || !pageAccessToken}
                      className="font-bold border-slate-300"
                  >
                      {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button 
                      onClick={handleSaveSettings}
                      disabled={testStatus !== 'success' || isSavingSettings}
                      className="font-black"
                  >
                      {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
