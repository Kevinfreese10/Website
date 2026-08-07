import TalentProfileForm from '@/components/dashboard/TalentProfileForm';

export default function PartnerTalentProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Let other practices and network clients know you are available for sub-contract work, or manage your CV and skill set.
        </p>
      </div>
      <TalentProfileForm />
    </div>
  );
}
