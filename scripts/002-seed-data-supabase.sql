-- Insert initial sample data
INSERT INTO participants (certificate_number, name, issue_date, class_name) VALUES
('CERT-2024-001', 'John Doe', '2024-01-15', 'Web Development Fundamentals'),
('CERT-2024-002', 'Jane Smith', '2024-01-20', 'React Advanced Course'),
('CERT-2024-003', 'Ahmad Rahman', '2024-02-01', 'Digital Marketing Strategy')
ON CONFLICT (certificate_number) DO NOTHING;
