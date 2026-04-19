import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

type DiffViewProps = {
  oldString: string
  newString: string
}

const customStyles = {
  variables: {
    dark: {
      diffViewerBackground: 'transparent',
      addedBackground: '#1a2e1a',
      addedColor: '#22c55e',
      removedBackground: '#2e1a1a',
      removedColor: '#ef4444',
      wordAddedBackground: '#14532d',
      wordRemovedBackground: '#7f1d1d',
      addedGutterBackground: '#1a2e1a',
      removedGutterBackground: '#2e1a1a',
      gutterBackground: '#1a1917',
      gutterColor: '#57534e',
      codeFoldBackground: '#1c1917',
      codeFoldContentColor: '#78716c',
    },
  },
}

export default function DiffView({ oldString, newString }: DiffViewProps) {
  return (
    <div className="rounded overflow-hidden text-xs font-mono">
      <ReactDiffViewer
        oldValue={oldString}
        newValue={newString}
        splitView={false}
        compareMethod={DiffMethod.WORDS}
        useDarkTheme
        styles={customStyles}
        hideLineNumbers={false}
      />
    </div>
  )
}
