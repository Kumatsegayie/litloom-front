import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Blogs.css";
import { getBlogs } from "../../services/blogsAPI";
import { getRichTextPreview } from "../../utils/richText";
import { resolveMediaUrl } from "../../utils/media";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../components/ui/PageDiscoverTitle";

const BlogsList = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await getBlogs();
        setBlogs(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load blogs');
      } finally {
        setLoading(false);
        // Restore scroll position after content loads
        const savedScrollPosition = sessionStorage.getItem('blogsScrollPosition');
        const navigated = sessionStorage.getItem('blogsNavigated');
        if (savedScrollPosition && navigated === 'true') {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScrollPosition, 10));
          }, 200); // Small delay to ensure content is fully rendered
          sessionStorage.removeItem('blogsNavigated');
        }
      }
    };

    fetchBlogs();
  }, []);

  // Save scroll position when navigating to blog
  const handleBlogClick = (blogRef) => {
    sessionStorage.setItem('blogsScrollPosition', window.scrollY.toString());
    sessionStorage.setItem('blogsNavigated', 'true');
    navigate(`/blogs/${blogRef}`);
  };

  if (loading) {
    return (
      <section className="blogs-page">
        <PageDiscoverTitle title="Blogs" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="blogs-feed"
          cardClassName="blog-card"
          thumbClassName="blog-thumb"
          bodyClassName="blog-info"
          rows={["mid", "full", "short"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="blogs-page">
        <PageDiscoverTitle title="Blogs" />
        <PageErrorState
          title="Unable to load blogs"
          message={`Error loading blogs: ${error}`}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  return (
    <section className="blogs-page">
      <PageDiscoverTitle title="Blogs" />

      <div className="blogs-feed">
        {blogs.map(blog => (
          <article
            key={blog.id}
            className="blog-card"
            onClick={() => handleBlogClick(blog.slug || blog.id)}
          >
            <div className="blog-thumb">
              <img
                src={resolveMediaUrl(blog.thumbnail, resolveMediaUrl(blog.images?.[0], "/placeholder.jpg"))}
                alt={blog.title}
              />
            </div>

            <div className="blog-info">
              <h2>{blog.title}</h2>
              <p className="blog-preview">{getRichTextPreview(blog.content, 120)}</p>
              <div className="blog-meta">
                <span className="blog-author">By {blog.author || 'Lit·loom'}</span>
                <span className="blog-date">{formatDate(blog.publishDate || blog.createdAt)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Floating Action Button - Removed for blogs */}
    </section>
  );
};

export default BlogsList;
