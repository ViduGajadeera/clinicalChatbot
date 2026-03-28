function MediaRenderer({ media }) {
  if (!media) return null;

  return media.map((url, i) => {
    if (url.endsWith(".mp4")) {
      return <video key={i} src={url} controls width="300" />;
    }
    return <img key={i} src={url} alt="media" width="300" />;
  });
}

export default MediaRenderer;