// Ensure forum_comments table has updated_at column for tracking edits
const { data: commentsUpdateAtCheck, error: updateAtCheckError } = await supabase
  .from('forum_comments')
  .select('updated_at')
  .limit(1);

if (updateAtCheckError && updateAtCheckError.message.includes('column "updated_at" does not exist')) {
  console.log('Adding updated_at column to forum_comments table...');
  
  // Using RPC to execute raw SQL to add the column
  const { error: addUpdateAtError } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL' 
  });
  
  if (addUpdateAtError) {
    console.error('Error adding updated_at column:', addUpdateAtError);
  } else {
    console.log('Added updated_at column to forum_comments table');
  }
}

// Check if summary column exists in forums table
const { data: forumsSummaryCheck, error: summaryCheckError } = await supabase
  .from('forums')
  .select('summary')
  .limit(1);

if (summaryCheckError && summaryCheckError.message.includes('column "summary" does not exist')) {
  console.log('Adding summary column to forums table...');
  
  // Using RPC to execute raw SQL to add the column
  const { error: addSummaryError } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE forums ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT NULL' 
  });
  
  if (addSummaryError) {
    console.error('Error adding summary column:', addSummaryError);
  } else {
    console.log('Added summary column to forums table');
  }
} 