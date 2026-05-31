import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPaintings } from "../../../services/paintingsAPI";
import { getRichTextPreview } from "../../../utils/richText";
import { buildConnectionErrorMessage } from "../../../utils/errorUtils";
import PageSkeleton from "../../../components/ui/PageSkeleton";
import PageErrorState from "../../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../../components/ui/PageDiscoverTitle";
import "./Paintings.css";

const PaintingsList = () => {
  const navigate = useNavigate();

  const [paintings, setPaintings] = useState([]);
  const [thumbOrientation, setThumbOrientation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getPaintings()
      .then(list => { if (!mounted) return; setPaintings(list); })
      .catch(err => { if (!mounted) return; console.error('getPaintings error', err); setError(err); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="paintings-page">
        <PageDiscoverTitle title="Paintings" />
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
        <PageDiscoverTitle title="Paintings" />
        <PageErrorState
          title="Unable to load paintings"
          message={buildConnectionErrorMessage("Paintings", error)}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="paintings-page">
      <PageDiscoverTitle title="Paintings" />

      {/* Feed */}
      {paintings.length === 0 && (
        <div className="empty-info">
          No paintings published yet.
        </div>
      )}
      <div className="paintings-feed">
        {paintings.map((painting) => (
          <article
            key={painting.id}
            className="painting-card"
            onClick={() => navigate(`/paintings/${painting.slug || painting.id}`)}
          >
            <div className={`painting-thumb ${thumbOrientation[painting.id] === "portrait" ? "is-portrait" : "is-landscape"}`}>
              <img
                src={painting.image || "/placeholder.jpg"}
                alt={painting.title}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const orientation = img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
                  setThumbOrientation((previous) => {
                    if (previous[painting.id] === orientation) return previous;
                    return { ...previous, [painting.id]: orientation };
                  });
                }}
                onError={() =>
                  setThumbOrientation((previous) => {
                    if (previous[painting.id] === "landscape") return previous;
                    return { ...previous, [painting.id]: "landscape" };
                  })
                }
              />
            </div>

            <div className="painting-info">
              <h2>{painting.title}</h2>
              <p className="painting-meta">
                {painting.artist} • {painting.year}
              </p>

              <p className="painting-desc">
                {getRichTextPreview(painting.description, 170)}
              </p>

              <div className="painting-footer">
                <span className="painting-tag">{painting.category}</span>
                <span className="view-hint">Open →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PaintingsList;
