export default function FormGuard({ children }) {
  // Submission flags have been removed — always render children.
  return children;
}