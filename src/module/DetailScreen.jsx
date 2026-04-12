import React from 'react';
import { useParams } from 'react-router';
import { Container } from 'reactstrap';

export function DetailScreen() {
  const { username } = useParams();

  return (
    <Container>
      <p>Detail of {username}</p>
    </Container>
  );
}
