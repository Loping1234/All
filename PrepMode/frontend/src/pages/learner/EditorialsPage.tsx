import { ContentBrowse } from '@/components/content/ContentBrowse'

export default function EditorialsPage() {
  return (
    <ContentBrowse
      title="Editorials"
      description="Original editorial analysis — argument structure, evidence, counterpoints, and vocabulary in context."
      categories={['Editorials']}
      topicPills={['Policy', 'Economy', 'Education', 'Environment', 'Governance', 'Infrastructure']}
    />
  )
}
