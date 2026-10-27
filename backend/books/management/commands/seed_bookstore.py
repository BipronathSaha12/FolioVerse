import datetime
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from books.models import Book


class Command(BaseCommand):
    help = 'Seeds FolioVerse with 2,000 rich, production-grade categorized books (Science, Tech, Fiction, Bengali & English Literature, Music)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--target',
            type=int,
            default=2000,
            help='Total number of books to ensure in the database (default: 2000)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing books before seeding'
        )

    def handle(self, *args, **options):
        target_count = options['target']
        should_clear = options['clear']

        if should_clear:
            self.stdout.write("Clearing existing books...")
            Book.objects.all().delete()

        current_count = Book.objects.count()
        needed_count = target_count - current_count

        if needed_count <= 0:
            self.stdout.write(self.style.SUCCESS(
                f"Database already has {current_count} books (>= {target_count}). No new books needed."
            ))
            return

        self.stdout.write(f"Currently {current_count} books in database. Generating {needed_count} books to reach {target_count}...")

        # Curated Unsplash book images by genre
        literature_covers = [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
        ]

        science_covers = [
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
        ]

        tech_covers = [
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
        ]

        fiction_covers = [
            "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1618609377864-68609b857e90?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?auto=format&fit=crop&w=600&q=80",
        ]

        music_covers = [
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
        ]

        # Rich Author and Title Templates by Category & Subcategory
        taxonomy_data = {
            "Literature & Novel": {
                "Bengali Literature": {
                    "language": "Bengali",
                    "covers": literature_covers,
                    "authors": [
                        "Rabindranath Tagore", "Kazi Nazrul Islam", "Sarat Chandra Chattopadhyay",
                        "Bibhutibhushan Bandyopadhyay", "Humayun Ahmed", "Manik Bandyopadhyay",
                        "Bankim Chandra Chattopadhyay", "Sunil Gangopadhyay", "Shirshendu Mukhopadhyay",
                        "Satyajit Ray", "Jibanananda Das", "Sukumar Ray", "Syed Mujtaba Ali",
                        "Michael Madhusudan Dutt", "Tarasankar Bandyopadhyay", "Samaresh Majumdar",
                        "Mahasweta Devi", "Zahir Raihan", "Shawkat Osman", "Shamsur Rahman",
                        "Al Mahmud", "Akhtaruzzaman Elias", "Selina Hossain", "Jashimuddin"
                    ],
                    "titles": [
                        "Gitanjali", "Agnibeena", "Pather Panchali", "Devdas", "Shonkhonil Karagar",
                        "Chander Pahar", "Shesher Kobita", "Anandamath", "Bisher Banshi", "Feluda: Joy Baba Felunath",
                        "Byomkesh Bakshi Samagra", "Hajar Churashir Maa", "Titash Ekti Nadir Naam", "Padma Nadir Majhi",
                        "Lalshalu", "Kobi", "Putul Nacher Itikatha", "Aranyak", "Srikanta", "Char Adhyay", "Gora",
                        "Noukadubi", "Chokher Bali", "Rajarshi", "Lipika", "Balaka", "Sonar Tori", "Kheya",
                        "Abol Tabol", "Ha-Ja-Ba-Ra-La", "Chhinnapatra", "Drishtipat", "Deshe Bideshe",
                        "Professor Shonku Samagra", "Meghnad Badh Kavya", "Banalata Sen", "Durbine",
                        "Kalbela", "Uttoradhikar", "Kalbhorom", "Gora Part II", "Nondito Noroke",
                        "Kothao Keu Nei", "Mishor Ali Rahasya", "Himu Samagra", "Shuvro", "Kobi Kobi Bhab",
                        "Rajar Golpo", "Borno Porichoy", "Kapalkundala", "Durgeshnandini", "Mrinalini",
                        "Bishbriksha", "Radharani", "Debiganj Rahashya", "Jatugriha", "Alo Andhar",
                        "Nodi O Nari", "Surjo Dighol Bari", "Chilekothar Sepai", "Khoabnama", "Kalo Borof",
                        "Gopon Chithi", "Moner Manush", "Gitanjali Swarnarekha", "Bideshi Ful", "Jononi"
                    ]
                },
                "English Literature": {
                    "language": "English",
                    "covers": literature_covers,
                    "authors": [
                        "William Shakespeare", "Jane Austen", "George Orwell", "Charles Dickens",
                        "Virginia Woolf", "James Joyce", "Harper Lee", "F. Scott Fitzgerald",
                        "Oscar Wilde", "Ernest Hemingway", "Emily Brontë", "Charlotte Brontë",
                        "Thomas Hardy", "John Steinbeck", "Arthur Conan Doyle", "Mary Shelley",
                        "Bram Stoker", "H.G. Wells", "Joseph Conrad", "E.M. Forster", "George Eliot",
                        "William Golding", "Aldous Huxley", "D.H. Lawrence", "Graham Greene"
                    ],
                    "titles": [
                        "1984", "Pride and Prejudice", "The Great Gatsby", "Hamlet", "To Kill a Mockingbird",
                        "Jane Eyre", "Wuthering Heights", "Great Expectations", "Moby Dick", "Frankenstein",
                        "Dracula", "Brave New World", "Animal Farm", "The Catcher in the Rye", "Lord of the Flies",
                        "Ulysses", "Macbeth", "Othello", "King Lear", "A Tale of Two Cities", "Oliver Twist",
                        "David Copperfield", "Emma", "Sense and Sensibility", "Northanger Abbey", "Heart of Darkness",
                        "Middlemarch", "The Picture of Dorian Gray", "The Old Man and the Sea", "A Farewell to Arms",
                        "For Whom the Bell Tolls", "The Sun Also Rises", "The Grapes of Wrath", "Of Mice and Men",
                        "Tess of the d'Urbervilles", "The Time Machine", "The War of the Worlds", "The Invisible Man",
                        "A Passage to India", "Mrs Dalloway", "To the Lighthouse", "Orlando", "Dubliners",
                        "A Portrait of the Artist as a Young Man", "The Adventures of Sherlock Holmes", "The Sign of Four"
                    ]
                },
                "World Classics": {
                    "language": "English",
                    "covers": literature_covers,
                    "authors": [
                        "Leo Tolstoy", "Fyodor Dostoevsky", "Gabriel García Márquez", "Victor Hugo",
                        "Franz Kafka", "Albert Camus", "Homer", "Dante Alighieri", "Haruki Murakami",
                        "Herman Melville", "Gustave Flaubert", "Alexandre Dumas", "Miguel de Cervantes",
                        "Johann Wolfgang von Goethe", "Yukio Mishima", "Anton Chekhov", "Milan Kundera"
                    ],
                    "titles": [
                        "War and Peace", "Crime and Punishment", "The Brothers Karamazov", "One Hundred Years of Solitude",
                        "Les Misérables", "The Metamorphosis", "The Stranger", "The Count of Monte Cristo",
                        "Don Quixote", "The Divine Comedy", "The Iliad", "The Odyssey", "Madame Bovary",
                        "Anna Karenina", "The Trial", "Norwegian Wood", "Kafka on the Shore", "The Plague",
                        "The Master and Margarita", "Faust", "The Unbearable Lightness of Being", "The Idiot",
                        "Notes from Underground", "Love in the Time of Cholera", "The Three Musketeers"
                    ]
                },
                "Poetry & Plays": {
                    "language": "English",
                    "covers": literature_covers,
                    "authors": [
                        "T.S. Eliot", "John Keats", "Sylvia Plath", "Robert Frost", "Walt Whitman",
                        "W.B. Yeats", "Samuel Beckett", "Arthur Miller", "Kahlil Gibran", "Pablo Neruda",
                        "Percy Bysshe Shelley", "Lord Byron", "Rainer Maria Rilke", "Emily Dickinson"
                    ],
                    "titles": [
                        "The Waste Land and Other Poems", "Leaves of Grass", "Songs of Innocence and Experience",
                        "Waiting for Godot", "Death of a Salesman", "The Prophet", "Twenty Love Poems and a Song of Despair",
                        "Selected Poems of Keats", "Ariel", "The Bell Jar and Poems", "The Road Not Taken",
                        "Duino Elegies", "The Complete Poems of Emily Dickinson", "Ode to a Nightingale"
                    ]
                },
                "Contemporary Novels": {
                    "language": "English",
                    "covers": literature_covers,
                    "authors": [
                        "Khaled Hosseini", "Yann Martel", "Cormac McCarthy", "Sally Rooney",
                        "Min Jin Lee", "Delia Owens", "Paulo Coelho", "Markus Zusak", "Kazuo Ishiguro",
                        "Chimamanda Ngozi Adichie", "Colson Whitehead", "Donna Tartt"
                    ],
                    "titles": [
                        "The Kite Runner", "A Thousand Splendid Suns", "Life of Pi", "The Road",
                        "Normal People", "Pachinko", "Where the Crawdads Sing", "The Alchemist",
                        "The Book Thief", "Never Let Me Go", "The Remains of the Day", "Half of a Yellow Sun",
                        "The Underground Railroad", "The Goldfinch", "Conversations with Friends"
                    ]
                }
            },
            "Science": {
                "Physics": {
                    "language": "English",
                    "covers": science_covers,
                    "authors": [
                        "Stephen Hawking", "Richard Feynman", "Brian Greene", "Michio Kaku",
                        "Carlo Rovelli", "Sean Carroll", "Max Tegmark", "Leonard Susskind",
                        "Frank Wilczek", "Steven Weinberg", "Roger Penrose", "Paul Dirac"
                    ],
                    "titles": [
                        "A Brief History of Time", "The Elegant Universe", "Six Easy Pieces",
                        "QED: The Strange Theory of Light and Matter", "The Character of Physical Law",
                        "Reality Is Not What It Seems", "The Order of Time", "The Fabric of the Cosmos",
                        "Quantum: Einstein, Bohr and the Great Debate", "Something Deeply Hidden",
                        "Seven Brief Lessons on Physics", "Hyperspace", "Parallel Worlds",
                        "Black Holes and Time Warps", "Our Mathematical Universe", "The Theoretical Minimum",
                        "Fundamentals: Ten Keys to Reality", "The First Three Minutes", "The Road to Reality"
                    ]
                },
                "Astronomy & Cosmology": {
                    "language": "English",
                    "covers": science_covers,
                    "authors": [
                        "Carl Sagan", "Neil deGrasse Tyson", "Kip Thorne", "Brian Cox",
                        "Phil Plait", "Katie Mack", "Martin Rees", "Alan Guth"
                    ],
                    "titles": [
                        "Cosmos", "Pale Blue Dot", "Death by Black Hole",
                        "Origins: Fourteen Billion Years of Cosmic Evolution", "Contact",
                        "Until the End of Time", "The End of Everything (Astrophysically Speaking)",
                        "The Inflationary Universe", "Human Universe", "Wonders of the Solar System",
                        "Astrophysics for People in a Hurry", "Starry Messenger"
                    ]
                },
                "Biology & Genetics": {
                    "language": "English",
                    "covers": science_covers,
                    "authors": [
                        "Richard Dawkins", "Charles Darwin", "Siddhartha Mukherjee", "Jennifer Doudna",
                        "Edward O. Wilson", "Robert Sapolsky", "Merlin Sheldrake", "Sean B. Carroll"
                    ],
                    "titles": [
                        "The Selfish Gene", "The Blind Watchmaker", "The Gene: An Intimate History",
                        "The Emperor of All Maladies", "The Origin of Species", "A Crack in Creation: Gene Editing",
                        "Behave: The Biology of Humans at Our Best and Worst", "Entangled Life: How Fungi Make Our Worlds",
                        "The Extended Phenotype", "The Song of the Cell", "On Human Nature"
                    ]
                },
                "Computer Science": {
                    "language": "English",
                    "covers": science_covers,
                    "authors": [
                        "Thomas H. Cormen", "Donald E. Knuth", "Harold Abelson", "Judea Pearl",
                        "Andrew S. Tanenbaum", "Alfred V. Aho", "John L. Hennessy", "Steven Skiena"
                    ],
                    "titles": [
                        "Introduction to Algorithms (CLRS)", "The Art of Computer Programming, Vol 1",
                        "Structure and Interpretation of Computer Programs (SICP)", "The Book of Why: The New Science of Cause and Effect",
                        "Modern Operating Systems", "Compilers: Principles, Techniques, and Tools",
                        "Computer Architecture: A Quantitative Approach", "The Algorithm Design Manual",
                        "Concrete Mathematics: A Foundation for Computer Science", "Algorithms to Live By"
                    ]
                },
                "Environmental Science": {
                    "language": "English",
                    "covers": science_covers,
                    "authors": [
                        "Rachel Carson", "Elizabeth Kolbert", "David Attenborough", "Robin Wall Kimmerer",
                        "Peter Wohlleben", "David Wallace-Wells", "Naomi Klein"
                    ],
                    "titles": [
                        "Silent Spring", "The Sixth Extinction: An Unnatural History", "Under a White Sky",
                        "A Life on Our Planet", "Braiding Sweetgrass: Indigenous Wisdom",
                        "The Hidden Life of Trees", "The Uninhabitable Earth: Life After Warming",
                        "This Changes Everything: Capitalism vs. The Climate"
                    ]
                }
            },
            "Technology": {
                "Artificial Intelligence & ML": {
                    "language": "English",
                    "covers": tech_covers,
                    "authors": [
                        "Ian Goodfellow", "Stuart Russell", "Peter Norvig", "Aurélien Géron",
                        "François Chollet", "Christopher M. Bishop", "Richard S. Sutton",
                        "Andriy Burkov", "David Foster", "Marc Peter Deisenroth"
                    ],
                    "titles": [
                        "Deep Learning", "Artificial Intelligence: A Modern Approach (4th Edition)",
                        "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
                        "Deep Learning with Python", "Pattern Recognition and Machine Learning",
                        "Reinforcement Learning: An Introduction", "The Hundred-Page Machine Learning Book",
                        "Generative Deep Learning: Teaching Machines to Paint, Write, Compose",
                        "Mathematics for Machine Learning", "Machine Learning Engineering"
                    ]
                },
                "Software Architecture": {
                    "language": "English",
                    "covers": tech_covers,
                    "authors": [
                        "Martin Kleppmann", "Robert C. Martin", "Martin Fowler", "Eric Evans",
                        "Sam Newman", "Alex Xu", "Michael T. Nygard", "Mark Richards"
                    ],
                    "titles": [
                        "Designing Data-Intensive Applications", "Clean Code: A Handbook of Agile Software Craftsmanship",
                        "Clean Architecture: A Craftsman's Guide to Software Structure",
                        "Domain-Driven Design: Tackling Complexity in the Heart of Software",
                        "Building Microservices: Designing Fine-Grained Systems",
                        "System Design Interview – An Insider's Guide (Volume 1 & 2)",
                        "Refactoring: Improving the Design of Existing Code",
                        "Release It!: Design and Deploy Production-Ready Software",
                        "Fundamentals of Software Architecture"
                    ]
                },
                "Web & Cloud Engineering": {
                    "language": "English",
                    "covers": tech_covers,
                    "authors": [
                        "Brendan Eich", "Kyle Simpson", "Addy Osmani", "Kelsey Hightower",
                        "Alex Banks", "Eve Porcello", "Ilya Grigorik", "Brendan Burns"
                    ],
                    "titles": [
                        "You Don't Know JS: Scope & Closures", "You Don't Know JS: Objects & Classes",
                        "Kubernetes: Up and Running", "Learning React: Modern Patterns for Developing React Apps",
                        "High Performance Browser Networking", "Designing Distributed Systems",
                        "Fullstack Node.js", "Cloud Native Patterns: Designing High-Availability Systems",
                        "Learning TypeScript", "Micro Frontends in Action"
                    ]
                },
                "Cybersecurity & Networks": {
                    "language": "English",
                    "covers": tech_covers,
                    "authors": [
                        "Kevin Mitnick", "Bruce Schneier", "Michael Sikorski", "Dafydd Stuttard",
                        "William Stallings", "Jon Erickson", "Ross Anderson", "Kim Zetter"
                    ],
                    "titles": [
                        "The Art of Deception: Controlling the Human Element of Security",
                        "Applied Cryptography: Protocols, Algorithms, and Source Code",
                        "Practical Malware Analysis", "The Web Application Hacker's Handbook",
                        "Hacking: The Art of Exploitation", "Security Engineering: A Guide to Building Dependable Distributed Systems",
                        "Countdown to Zero Day", "Blue Team Field Manual"
                    ]
                },
                "Mobile Development": {
                    "language": "English",
                    "covers": tech_covers,
                    "authors": [
                        "Eric Windmill", "Nader Dabit", "Bill Phillips", "Brian Gardner",
                        "Ray Wenderlich", "Svetlana Isakova"
                    ],
                    "titles": [
                        "Flutter in Action", "React Native in Action: Cross-Platform Mobile Applications",
                        "Android Programming: The Big Nerd Ranch Guide", "iOS Programming: The Big Nerd Ranch Guide",
                        "Kotlin in Action", "Swift Apprentice: Beginning Programming with Swift"
                    ]
                }
            },
            "Fiction": {
                "Science Fiction": {
                    "language": "English",
                    "covers": fiction_covers,
                    "authors": [
                        "Frank Herbert", "Isaac Asimov", "Arthur C. Clarke", "Philip K. Dick",
                        "William Gibson", "Ursula K. Le Guin", "Cixin Liu", "Neal Stephenson",
                        "Dan Simmons", "Orson Scott Card", "Stanislaw Lem", "Adrian Tchaikovsky"
                    ],
                    "titles": [
                        "Dune", "Neuromancer", "Foundation", "Foundation and Empire", "Second Foundation",
                        "The Left Hand of Darkness", "Snow Crash", "Hyperion", "The Fall of Hyperion",
                        "Ender's Game", "The Three-Body Problem", "The Dark Forest", "Death's End",
                        "Do Androids Dream of Electric Sheep?", "Solaris", "2001: A Space Odyssey",
                        "Rendezvous with Rama", "Ringworld", "The Diamond Age", "Children of Time"
                    ]
                },
                "Fantasy & Magic": {
                    "language": "English",
                    "covers": fiction_covers,
                    "authors": [
                        "J.R.R. Tolkien", "George R.R. Martin", "J.K. Rowling", "Brandon Sanderson",
                        "Patrick Rothfuss", "Neil Gaiman", "C.S. Lewis", "Robert Jordan",
                        "Robin Hobb", "Terry Pratchett"
                    ],
                    "titles": [
                        "The Hobbit", "The Fellowship of the Ring", "The Two Towers", "The Return of the King",
                        "A Game of Thrones", "A Clash of Kings", "A Storm of Swords", "Harry Potter and the Sorcerer's Stone",
                        "Harry Potter and the Prisoner of Azkaban", "The Way of Kings", "Words of Radiance",
                        "The Name of the Wind", "The Wise Man's Fear", "Mistborn: The Final Empire",
                        "American Gods", "The Lion, the Witch and the Wardrobe", "The Eye of the World",
                        "Assassin's Apprentice", "Guards! Guards!"
                    ]
                },
                "Mystery & Detective": {
                    "language": "English",
                    "covers": fiction_covers,
                    "authors": [
                        "Agatha Christie", "Arthur Conan Doyle", "Raymond Chandler", "Gillian Flynn",
                        "Stieg Larsson", "Michael Connelly", "Dashiell Hammett", "Tana French"
                    ],
                    "titles": [
                        "And Then There Were None", "The Murder of Roger Ackroyd", "Murder on the Orient Express",
                        "A Study in Scarlet", "The Hound of the Baskervilles", "The Big Sleep",
                        "The Girl with the Dragon Tattoo", "Gone Girl", "In the Woods",
                        "The Maltese Falcon", "The Black Echo", "The Likeness"
                    ]
                },
                "Psychological Thriller": {
                    "language": "English",
                    "covers": fiction_covers,
                    "authors": [
                        "Stephen King", "Thomas Harris", "Paula Hawkins", "Alex Michaelides",
                        "Dennis Lehane", "B.A. Paris", "Lucy Foley", "Karin Slaughter"
                    ],
                    "titles": [
                        "The Shining", "Misery", "The Silence of the Lambs", "Red Dragon",
                        "The Girl on the Train", "The Silent Patient", "Shutter Island",
                        "Behind Closed Doors", "The Guest List", "Pretty Girls", "Sharp Objects"
                    ]
                },
                "Historical Fiction": {
                    "language": "English",
                    "covers": fiction_covers,
                    "authors": [
                        "Ken Follett", "Hilary Mantel", "Kristin Hannah", "Anthony Doerr",
                        "Robert Graves", "Michael Ondaatje", "Carlos Ruiz Zafón", "Arthur Golden"
                    ],
                    "titles": [
                        "The Pillars of the Earth", "World Without End", "Wolf Hall", "Bring Up the Bodies",
                        "The Nightingale", "All the Light We Cannot See", "I, Claudius",
                        "The English Patient", "The Shadow of the Wind", "Memoirs of a Geisha"
                    ]
                }
            },
            "Music": {
                "Music Theory & Composition": {
                    "language": "English",
                    "covers": music_covers,
                    "authors": [
                        "Daniel J. Levitin", "Walter Piston", "Mark Levine", "Arnold Schoenberg",
                        "John Mehegan", "Vincent Persichetti", "Rikky Rooksby"
                    ],
                    "titles": [
                        "This Is Your Brain on Music: The Science of a Human Obsession",
                        "Harmony (Fifth Edition)", "The Jazz Theory Book",
                        "Fundamentals of Musical Composition", "Jazz Improvisation: Tonal and Rhythmic Principles",
                        "Twentieth-Century Harmony: Creative Aspects and Practice",
                        "How to Write Songs on Guitar", "The Songwriting Sourcebook"
                    ]
                },
                "Biographies & Memoirs": {
                    "language": "English",
                    "covers": music_covers,
                    "authors": [
                        "Bob Dylan", "Miles Davis", "Keith Richards", "Patti Smith",
                        "Bruce Springsteen", "Elton John", "Anthony Kiedis", "Jay-Z"
                    ],
                    "titles": [
                        "Chronicles: Volume One", "Miles: The Autobiography", "Life",
                        "Just Kids", "Born to Run", "Me: Elton John Official Autobiography",
                        "Scar Tissue", "Decoded"
                    ]
                },
                "History & World Music": {
                    "language": "English",
                    "covers": music_covers,
                    "authors": [
                        "Alex Ross", "Ted Gioia", "Peter Guralnick", "Kelefa Sanneh",
                        "David Byrne", "Simon Reynolds"
                    ],
                    "titles": [
                        "The Rest Is Noise: Listening to the Twentieth Century",
                        "The History of Jazz", "Delta Blues: The Life and Times of the Mississippi Masters",
                        "Major Labels: A History of Popular Music in Seven Genres",
                        "How Music Works", "Rip It Up and Start Again: Postpunk 1978–1984"
                    ]
                },
                "Instruments & Performance": {
                    "language": "English",
                    "covers": music_covers,
                    "authors": [
                        "Troy Stetina", "Philip Toshio Sudo", "Kenny Werner", "Barry Green",
                        "Hal Leonard Corp.", "Carl Czerny"
                    ],
                    "titles": [
                        "Guitar Aerobics: A 52-Week Workout Program",
                        "Zen Guitar", "Effortless Mastery: Liberating the Master Musician Within",
                        "The Inner Game of Music", "Hal Leonard Guitar Method Complete Edition",
                        "Practical Method for Beginners on the Pianoforte, Op. 599"
                    ]
                }
            }
        }

        # Collect category buckets
        flat_catalog = []
        for cat_name, subcats in taxonomy_data.items():
            for subcat_name, info in subcats.items():
                for title in info["titles"]:
                    for author in info["authors"]:
                        flat_catalog.append({
                            "category": cat_name,
                            "subcategory": subcat_name,
                            "language": info["language"],
                            "author": author,
                            "base_title": title,
                            "covers": info["covers"]
                        })

        random.seed(42)  # Deterministic seed for reproducible rich catalog
        random.shuffle(flat_catalog)

        conditions = ['New', 'New', 'Like New', 'Good', 'Fair']
        modifiers = [
            "Complete Deluxe Edition", "Annotated Scholar Edition", "Collector's Hardcover",
            "Special Illustrated Edition", "Authorized Translation", "Centenary Edition",
            "Critical Companion Edition", "Definitive Master Edition", "Volume I",
            "Volume II", "Paperback Classics Edition", "Revised & Expanded Edition"
        ]

        books_to_create = []
        batch_size = 500

        for i in range(needed_count):
            template = flat_catalog[i % len(flat_catalog)]
            edition_mod = modifiers[i % len(modifiers)] if i >= len(flat_catalog) else None

            if edition_mod:
                book_title = f"{template['base_title']} ({edition_mod})"
            else:
                book_title = template['base_title']

            # Vary stock:
            # ~85% available (stock 5..50)
            # ~10% low stock (stock 1..3)
            # ~5% sold out (stock 0)
            stock_roll = random.random()
            if stock_roll < 0.05:
                stock = 0
                status = 'sold'
            elif stock_roll < 0.15:
                stock = random.randint(1, 3)
                status = 'low_stock'
            else:
                stock = random.randint(5, 55)
                status = 'available'

            # Pricing: BDT 185.00 to BDT 1,250.00 (meets >= 180 BDT check constraint)
            price = round(random.uniform(185.00, 1250.00), 2)

            # Publication year between 1910 and 2024
            pub_year = random.randint(1910, 2024)
            pub_month = random.randint(1, 12)
            pub_day = random.randint(1, 28)
            published_date = datetime.date(pub_year, pub_month, pub_day)

            # ISBN-13
            isbn = f"978-{random.randint(100, 999)}-{random.randint(10000, 99999)}-{random.randint(0, 9)}"

            # Cover image
            cover_url = random.choice(template['covers'])

            # Description
            description = (
                f"{template['base_title']} by {template['author']} — essential {template['subcategory']} "
                f"masterwork in our {template['category']} catalog. Condition: {random.choice(conditions)}. "
                f"High quality publication featuring insightful commentary, verified typography, and pristine binding."
            )

            book = Book(
                title=book_title,
                author=template['author'],
                price=price,
                published_date=published_date,
                category=template['category'],
                subcategory=template['subcategory'],
                language=template['language'],
                condition=random.choice(conditions),
                stock=stock,
                status=status,
                isbn=isbn,
                description=description,
                cover_image=cover_url,
            )
            books_to_create.append(book)

            if len(books_to_create) >= batch_size:
                with transaction.atomic():
                    Book.objects.bulk_create(books_to_create)
                self.stdout.write(f"Inserted batch of {len(books_to_create)} books...")
                books_to_create = []

        if books_to_create:
            with transaction.atomic():
                Book.objects.bulk_create(books_to_create)
            self.stdout.write(f"Inserted final batch of {len(books_to_create)} books.")

        final_count = Book.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded FolioVerse Book Store! Total books in database: {final_count} (Science, Tech, Fiction, Literature, Music)"
        ))
