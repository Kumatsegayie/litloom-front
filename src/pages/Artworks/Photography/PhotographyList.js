import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPhotos } from "../../../services/photographyAPI";
import { getRichTextPreview } from "../../../utils/richText";
import { buildConnectionErrorMessage } from "../../../utils/errorUtils";
import PageSkeleton from "../../../components/ui/PageSkeleton";
import PageErrorState from "../../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../../components/ui/PageDiscoverTitle";
import "../Paintings/Paintings.css";

const PhotographyList = () => {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [thumbOrientation, setThumbOrientation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getPhotos()
      .then((list) => { if (!mounted) return; setPhotos(list); })
      .catch((err) => { if (!mounted) return; console.error("getPhotos error", err); setError(err); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="paintings-page">
        <PageDiscoverTitle title="Photography" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="paintings-feed"
          cardClassName="painting-card"
          thumbClassName="painting-thumb"
          bodyClassName="painting-info"
          rows={["mid", "short", "full"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="paintings-page">
        <PageDiscoverTitle title="Photography" />
        <PageErrorState
          title="Unable to load photography"
          message={buildConnectionErrorMessage("Photography", error)}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="paintings-page">
      <PageDiscoverTitle title="Photography" />

      {photos.length === 0 && (
        <div className="empty-info">
          No photos published yet.
        </div>
      )}
      <div className="paintings-feed">
        {photos.map((photo) => (
          <article
            key={photo.id}
            className="painting-card"
            onClick={() => navigate(`/photos/${photo.slug || photo.id}`)}
          >
            <div className={`painting-thumb ${thumbOrientation[photo.id] === "portrait" ? "is-portrait" : "is-landscape"}`}>
              <img
                src={photo.image || "/placeholder.jpg"}
                alt={photo.title}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const orientation = img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
                  setThumbOrientation((previous) => {
                    if (previous[photo.id] === orientation) return previous;
                    return { ...previous, [photo.id]: orientation };
                  });
                }}
                onError={() =>
                  setThumbOrientation((previous) => {
                    if (previous[photo.id] === "landscape") return previous;
                    return { ...previous, [photo.id]: "landscape" };
                  })
                }
              />
            </div>

            <div className="painting-info">
              <h2>{photo.title}</h2>
              <p className="painting-meta">
                {photo.photographer} • {photo.year}
              </p>

              <p className="painting-desc">
                {getRichTextPreview(photo.description, 170)}
              </p>

              <div className="painting-footer">
                <span className="painting-tag">{photo.category}</span>
                <span className="view-hint">Open →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PhotographyList;
