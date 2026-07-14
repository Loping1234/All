import { ContentBrowse } from '@/components/content/ContentBrowse'

/** Flagship English page: English + Vocabulary categories with topic pills. */
export default function EnglishPage() {
  return (
    <ContentBrowse
      title="English"
      description="Strengthen your verbal core with Reading Comprehension, Grammar, Vocabulary, and word skills."
      categories={['English', 'Vocabulary']}
      topicPills={[
        'Reading Comprehension',
        'Grammar',
        'Vocabulary',
        'Parajumbles',
        'Para Summary',
        'Word Roots',
        'Synonyms',
        'Idioms',
        'Error Spotting',
      ]}
    />
  )
}
