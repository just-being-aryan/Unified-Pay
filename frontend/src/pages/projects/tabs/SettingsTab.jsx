// src/pages/projects/tabs/SettingsTab.jsx
export default function SettingsTab({ project }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Project Settings</h2>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <p><strong>Name:</strong> {project.name}</p>
        <p><strong>Description:</strong> {project.description || "-"}</p>
        <p><strong>Environment:</strong> {project.environment}</p>
        <p><strong>Callbacks:</strong></p>
        <pre className="bg-gray-100 p-3 rounded-lg text-sm">
{JSON.stringify(project.callbacks, null, 2)}
        </pre>
      </div>
    </div>
  );
}
