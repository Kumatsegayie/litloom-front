import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { createBookSubmission } from "../../services/booksAPI";
import PageBackButton from "../../components/ui/PageBackButton";
import "./BookSubmission.css";

const BookSubmission = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    year: "",
    description: "",
    submittedBy: "",
    submittedByEmail: ""
  });
  const [files, setFiles] = useState({
    cover: null,
    images: [],
    pdf: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (name === 'images') {
      setFiles(prev => ({
        ...prev,
        [name]: Array.from(fileList)
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0] || null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Add files
      if (files.cover) {
        submitData.append('cover', files.cover);
      }
      files.images.forEach((file, index) => {
        submitData.append(`images`, file);
      });
      if (files.pdf) {
        submitData.append('pdf', files.pdf);
      }

      await createBookSubmission(submitData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit book');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="book-submission-page">
        <div className="submission-success">
          <h1>Book Submitted Successfully!</h1>
          <p>Your book has been submitted and will be reviewed by our team. You'll receive an email notification once it's approved.</p>
          <button className="hero-btn primary" onClick={() => navigate('/books')}>
            Browse Books
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="book-submission-page">
      <div className="submission-container">
        <PageBackButton fallbackPath="/books" label="Back" />

        <header className="submission-header">
          <h1>Submit a Book</h1>
          <p>Share your literary work with our community. All submissions are reviewed before publication.</p>
        </header>

        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
            <label htmlFor="title">Book Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter the book title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              placeholder="Enter the author's name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre *</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              required
              placeholder="Enter the book genre (e.g., Fiction, Poetry, Science Fiction)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Publication Year *</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              placeholder="Enter the publication year"
              min="1000"
              max={new Date().getFullYear()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="6"
              placeholder="Provide a description of the book"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cover">Cover Image</label>
            <input
              type="file"
              id="cover"
              name="cover"
              accept="image/*"
              onChange={handleFileChange}
            />
            <small>Upload a cover image for the book (optional)</small>
          </div>

          <div className="form-group">
            <label htmlFor="images">Additional Images</label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <small>Upload additional images related to the book (optional)</small>
          </div>

          <div className="form-group">
            <label htmlFor="pdf">PDF File *</label>
            <input
              type="file"
              id="pdf"
              name="pdf"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            <small>Upload the PDF file of the book</small>
          </div>

          <div className="form-group">
            <label htmlFor="submittedBy">Your Name *</label>
            <input
              type="text"
              id="submittedBy"
              name="submittedBy"
              value={formData.submittedBy}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="submittedByEmail">Your Email *</label>
            <input
              type="email"
              id="submittedByEmail"
              name="submittedByEmail"
              value={formData.submittedByEmail}
              onChange={handleInputChange}
              required
              placeholder="Enter your email address"
            />
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="hero-btn primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Book'}
            {!loading && <Upload size={18} />}
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookSubmission;
