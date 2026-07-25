import { useTranslation } from '@/hooks/useTranslation';

const SupportLinks = () => {
  const _ = useTranslation();

  return (
    <div className='my-2 flex flex-col items-center gap-2'>
      <p className='text-neutral-content text-sm'>{_('Self-hosted build')}</p>
    </div>
  );
};

export default SupportLinks;
