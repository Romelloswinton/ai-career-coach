import React from "react"

type Props = {
  params: any
}

const CoverLetter = async ({ params }: Props) => {
  const id = await params.id
  return <div>CoverLetter: {id}</div>
}

export default CoverLetter
