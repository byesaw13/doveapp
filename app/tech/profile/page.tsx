export default function TechProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <p className="text-muted-foreground">
        Technician profile settings and information.
      </p>
      {/* TODO: Implement profile management */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <p className="text-muted-foreground">Technician Name</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <p className="text-muted-foreground">technician@example.com</p>
        </div>
      </div>
    </div>
  );
}
