import { Button, showToast, useSession, VerdocsTemplatesList } from '@verdocs/react-sdk';

export default function DashboardView() {
  const { profile, endpoint } = useSession();

  // Clearing the session re-renders the route guard, which redirects to /login.
  const handleSignOut = () => {
    endpoint.clearSession();
  };

  return (
    <div>
      <header className="app-header">
        <h1>
          Verdocs React Quickstart
        </h1>
        <div className="user">
          {profile ? `${profile.first_name} ${profile.last_name} (${profile.email})` : ''}
        </div>
        <Button label="Sign Out" size="small" variant="outline" onClick={handleSignOut} />
      </header>

      <main className="app-main">
        <VerdocsTemplatesList
          onViewTemplate={({ template }) => showToast(`View template: ${template.name}`, { style: 'info' })}
          onSubmittedData={({ template }) => showToast(`Submissions for: ${template.name}`, { style: 'info' })}
          onEditTemplate={({ template }) => showToast(`Edit template: ${template.name}`, { style: 'info' })}
          onSdkError={error => showToast(error.message, { style: 'error' })}
        />
      </main>
    </div>
  );
}
