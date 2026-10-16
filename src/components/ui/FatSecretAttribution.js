export default function FatSecretAttribution({ className = "" }) {
  return (
    <p className={`text-xs text-graphite/55 ${className}`}>
      {/* Snippet exigido pela política de atribuição da fatsecret Platform API */}
      <a
        href="https://platform.fatsecret.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-olive-900/20 underline-offset-2 hover:text-olive-800"
      >
        Powered by fatsecret Platform API
      </a>
    </p>
  );
}
