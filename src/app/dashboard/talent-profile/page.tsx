import TalentProfileForm from '@/components/dashboard/TalentProfileForm';

export default function DashboardTalentProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Let accounting firms in the network know you are looking for work, upload your CV, and list your core skills.
        </p>
      </div>
      <TalentProfileForm />
    </div>
  );
}
