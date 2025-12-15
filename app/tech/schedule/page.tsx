export default function TechSchedulePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Schedule</h1>
      <p className="text-muted-foreground">
        View your upcoming schedule. (This page shows the admin schedule for
        now.)
      </p>
      {/* TODO: Implement tech-specific schedule view */}
      <iframe
        src="/admin/schedule"
        className="w-full h-screen border rounded"
        title="Schedule"
      />
    </div>
  );
}
