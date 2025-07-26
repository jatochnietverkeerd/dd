export default function WhatsAppFloat() {
  return (
    <div 
      className="fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: '#D9C89E',
        zIndex: 99999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <a
        href="https://wa.me/31615404104?text=Hello%20DD%20Cars"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-full flex items-center justify-center rounded-full hover:scale-110 transition-transform"
      >
        <span className="text-2xl">💬</span>
      </a>
    </div>
  );
}