import { ContentBrowse } from '@/components/content/ContentBrowse'

export default function GkPage() {
  return (
    <ContentBrowse
      title="GK"
      description="General awareness and static GK — polity, geography, economy, institutions, and recall-ready facts."
      categories={['GK', 'Static GK']}
      topicPills={['Polity', 'Geography', 'Economy', 'History', 'Science', 'Art and Culture', 'Institutions']}
    />
  )
}
