import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { getBooks } from "../../services/booksAPI";
import { getRichTextPreview } from "../../utils/richText";
import { buildConnectionErrorMessage } from "../../utils/errorUtils";
import { resolveMediaUrl } from "../../utils/media";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../components/ui/PageDiscoverTitle";
import "./Books.css";

const BooksList = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const booksData = await getBooks();
        setBooks(booksData);
      } catch (err) {
        setError(err);
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <section className="books-page">
        <PageDiscoverTitle title="Books" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="books-grid"
          cardClassName="book-card"
          thumbClassName="page-feed-skeleton-book-thumb"
          bodyClassName="book-card-content"
          rows={["mid", "short", "full"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="books-page">
        <PageDiscoverTitle title="Books" />
        <PageErrorState
          title="Unable to load books"
          message={buildConnectionErrorMessage("Books", error)}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="books-page">
      <PageDiscoverTitle title="Books" />
      <div className="books-grid">
        {books.map(book => (
          <Link key={book.id} to={`/books/${book.slug || book.id}`} className="book-card">
            <img
              src={resolveMediaUrl(book.cover, "https://via.placeholder.com/300x400/0f3d2f/fff?text=No+Cover")}
              alt={book.title}
              onError={e => e.target.src="https://via.placeholder.com/300x400/0f3d2f/fff?text=No+Cover"}
            />
            <div className="book-card-content">
              <h3>{book.title}</h3>
              <p className="book-author">By {book.author}</p>
              <p className="book-genre-year">{book.genre} • {book.year}</p>
              {book.description && (
                <p className="book-preview">{getRichTextPreview(book.description, 120)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BooksList;
